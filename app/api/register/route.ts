import {NextRequest,NextResponse} from "next/server";
import {backend} from "@/lib/backend";
import {isRegistrationClosed,REGISTRATION_CLOSED_ERROR} from "@/lib/registration";
export const runtime="nodejs";
export async function POST(req:NextRequest){
 if(isRegistrationClosed())return NextResponse.json({error:REGISTRATION_CLOSED_ERROR},{status:410});
 try{
  const form=await req.formData();
  const file=form.get("receipt");
  if(!(file instanceof File))return NextResponse.json({error:"Adjuntá un comprobante."},{status:400});
  if(file.size>4*1024*1024 || file.size<100) return NextResponse.json({error:"El archivo debe tener entre 100 bytes y 4 MB."},{status:400});
  const allowed=["image/jpeg","image/png","application/pdf"];
  if(!allowed.includes(file.type))return NextResponse.json({error:"Solo JPG, PNG o PDF."},{status:400});
  const buf=Buffer.from(await file.arrayBuffer());
  const signature=buf.subarray(0,8);
  const valid=file.type==="image/jpeg" ? signature[0]===0xff&&signature[1]===0xd8&&signature[2]===0xff
   :file.type==="image/png" ? signature.equals(Buffer.from([137,80,78,71,13,10,26,10]))
   :buf.subarray(0,5).toString()==="%PDF-";
  if(!valid)return NextResponse.json({error:"El contenido no coincide con el formato declarado."},{status:400});
  const data={
   name:String(form.get("name")||"").trim().slice(0,140),
   email:String(form.get("email")||"").trim().toLowerCase().slice(0,180),
   phone:String(form.get("phone")||"").replace(/[^\d+]/g,"").slice(0,20),
   method:String(form.get("method")||""),
   reference:String(form.get("reference")||"").trim().slice(0,100),
   volunteer:form.get("volunteer")==="yes",
   consent:form.get("consent")==="yes",
   website:String(form.get("website")||""),
   receipt:{name:file.name.slice(0,130),type:file.type,base64:buf.toString("base64")}
  };
  if(data.website)return NextResponse.json({ok:true,message:"Recibido"});
  if(!data.name||!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)||data.phone.length<8||!["SINPE","TRANSFERENCIA"].includes(data.method)||!data.reference||!data.volunteer||!data.consent)
   return NextResponse.json({error:"Revisá los datos obligatorios."},{status:400});
  const result=await backend("register",{data});
  return NextResponse.json({ok:true,id:result.id});
 }catch(e){
  const message=e instanceof Error?e.message:"Error inesperado";
  if(message.startsWith("Las inscripciones cerraron el 30 de noviembre"))return NextResponse.json({error:message},{status:410});
  return NextResponse.json({error:message},{status:500});
 }
}
