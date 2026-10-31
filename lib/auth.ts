import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
export const authOptions:NextAuthOptions={
 providers:[GoogleProvider({clientId:process.env.GOOGLE_CLIENT_ID||"",clientSecret:process.env.GOOGLE_CLIENT_SECRET||""})],
 session:{strategy:"jwt"},pages:{signIn:"/admin"},
 callbacks:{
  async signIn({account,profile}){return account?.provider==="google" && Boolean(profile?.email_verified);},
  async session({session,token}){if(session.user && token.email) session.user.email=token.email;return session;}
 },
 secret:process.env.NEXTAUTH_SECRET
};
