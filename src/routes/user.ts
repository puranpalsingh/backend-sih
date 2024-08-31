import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
// @ts-ignore
import formidable from 'formidable';
// @ts-ignore
import fs from 'fs';
import { SignatureKey } from "hono/utils/jwt/jws";


export const userRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECERT : SignatureKey;
    },
    Variables: {
        userId: any;
    }
}>();



userRouter.use('/api/v1/*', async(c, next) => {
    const jwt = c.req.header('Authorization');
    if(!jwt) {
        c.status(401);
        return c.json({
            error : 'unauthorized'
        });
    }
    const token = jwt.split(' ')[1];
    const payload = await verify(token, c.env.JWT_SECERT);
    if(!payload) {
        c.status(401);
        return c.json({
            error  : "unauthorized"
            
        });
    }
    c.set('userId', payload.id);
    await next();
})


userRouter.post('/signup',async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    try {
        const user = await prisma.user.create({
            data : {
                email : body.email,
                password : body.password,
                name : body.name
            }
        });

        const jwt = await sign({
            id : user.id
        }, c.env.JWT_SECERT);

        return c.json({jwt});
    }
    catch(err) {
        c.status(404);
        return c.json({
            error : 'error occured while logging'
        });
    }

})

userRouter.post('signin' , async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const user = await prisma.user.findUnique({
        where : {
            email : body.email,
            password : body.password
        }
    });
    if(!user) {
        c.status(403);
        return c.json({
            error : "user not found"
        });
    }

    const jwt = await sign({id : user.id}, c.env.JWT_SECERT);
    return c.json({
        jwt
    });
});

userRouter.post('/upploadResume',async(c) => {

    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL
    }).$extends(withAccelerate());

    const form = new formidable.IncomingForm();
    const userId = c.get('userId');

    return new Promise((resolve, reject) => {
        form.parse(c.req.raw, async (err : any , fields : any, files : any) => {
          if (err) {
            c.status(500);
            return resolve(c.json({ error: 'Failed to parse form data' }, 500));
          }
    
          const file = files.file as formidable.File;
          const fileData = fs.readFileSync(file.filepath);
    
          try {
            const resume = await prisma.file.create({
              data: {
                fileName: file.originalFilename!,
                data: fileData,
                contentType: file.mimetype!,
                userId: userId,
              },
            });
    
            resolve(c.json({ message: 'Resume uploaded successfully', resume }));
          } catch (error) {
            console.error(error);
            c.status(500);
            resolve(c.json({ error: 'Failed to upload resume' }, 500));
          } finally {
            fs.unlinkSync(file.filepath); 
          }
        });
      });
})