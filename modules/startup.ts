import { environment, ZuploContext, ZuploRequest } from "@zuplo/runtime";
import crypto from 'crypto';
const GROQ_API_KEY = environment.GROQ_API_KEY
const secretKey = Buffer.from('12345678901234567890123456789012', 'utf8'); // 32 bytes
const staticIv = Buffer.from('1234567890123456', 'utf8');
function getUserPrompt(ticketDescription:string) : string
{
    return  `Give an array of objects in this format "[{summary:\"sub-task-title\",description:\"sub-task-description\"},...]", after breaking this Jira ticket description:"${ticketDescription}" into the meaningful possible Jira sub tasks`

}

const encrypt = (text) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', secretKey, staticIv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return encrypted.toString('hex');
};

const decrypt = (encryptedData) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, staticIv);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedData, 'hex')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
};


const getMessage = (ticketDescription : string) =>(
  {
     "messages": [
        {
          "role": "user",
          "content": getUserPrompt(ticketDescription),
        },
      ],
      "model": "llama3-8b-8192",
  })


export default async function (request: ZuploRequest, context: ZuploContext) {
  const {ticketDescription} = await request.json() as {ticketDescription:string};
  const decryptedDescription = decrypt(ticketDescription)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    body: JSON.stringify(getMessage(decryptedDescription)),
    headers:{
      'authorization' : `Bearer ${GROQ_API_KEY}`,
      'content-type' : 'application/json'
    }
  })

  const responseData = encrypt(await response.json())
  
  return responseData
}