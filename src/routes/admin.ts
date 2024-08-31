import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { SignatureKey } from "hono/utils/jwt/jws";


export const adminRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECERT : SignatureKey;
    }, 
    Variables : {
        AdminId : any;
    }
}>();

adminRouter.use('/upload/*' , async(c, next) => {
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
    c.set('AdminId', payload.id);
    await next();
})

adminRouter.post('/signup', async(c) => {
    const prisma = new PrismaClient({
        datasourceURL : c.env?.DATABASE_URL
    }).$extends(withAccelerate());
    const body = await c.req.json();

    try {
        const admin = await prisma.admin.create({
            data : {
                email : body.email,
                password : body.password,
                firstName : body.firstName,
                lastName : body.lastName
            }
        });

        const token = await sign({id : admin.id}, c.env.JWT_SECERT);

        return c.json({
            token
        })
    } catch(err) {
        c.status(403);
        c.json({
            error : "error occured while logging"
        });
    }
});

adminRouter.post('/signin', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const admin = await prisma.admin.findUnique({
        where : {
            email : body.email,
            password : body.password,
            
        }
    });
    if(!admin) {
        c.status(403);
        return c.json({
            error : 'error while logging '
        });
    }

    const token = await sign({
        id : admin.id
    }, c.env?.JWT_SECERT);

    return c.json({
        token
    })
})


adminRouter.post('/job', async(c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env?.JWT_SECERT
    }).$extends(withAccelerate());

    const body = await c.req.json();

    try {
        const adminId = c.get('AdminId');
        const body = await c.req.json();
        const job = await prisma.job.create({
            data : {
                title : body.title,
                post : body.post,
                Qulification : body.Qulification,
                adminId : adminId
            }
        })
        return c.json({
            msg : "job created successfully"
        });
    }
    catch (err) {
        c.status(403);
        return c.json({
            msg : "error occured"
        })
    }
})