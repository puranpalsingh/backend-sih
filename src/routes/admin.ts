import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";
import { JWTPayload } from "hono/utils/jwt/types";
import { SignatureKey } from "hono/utils/jwt/jws";
import { bodyLimit } from "hono/body-limit";

export const adminRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECERT : SignatureKey;
    }
}>();

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

    const body = c.req.json();
    const admin = await prisma.admin.findUnique({
        where : {
            email : body.email,
            
        }
    })
})