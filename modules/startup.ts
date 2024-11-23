import { environment, ZuploContext, ZuploRequest } from "@zuplo/runtime";

const GROQ_API_KEY = environment.GROQ_API_KEY

function getUserPrompt(ticketDescription:string) : string
{
    return  `Give an array of objects in this format "[{summary:\"sub-task-title\",description:\"sub-task-description\"},...]", after breaking this Jira ticket description:"${ticketDescription}" into the meaningful possible Jira sub tasks`

}

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

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions',{
    method:'POST',
    body: JSON.stringify(getMessage(ticketDescription)),
    headers:{
      'authorization' : `Bearer ${GROQ_API_KEY}`,
      'content-type' : 'application/json'
    }
  })

  const responseData = await response.json()

  return responseData
}