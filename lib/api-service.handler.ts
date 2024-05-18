import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { APIGatewayProxyEventV2WithRequestContext, Context } from "aws-lambda"

interface Rate {
  buy?: number
  sell?: number
}

interface ExchangeRate {
  type: "bank notes" | "dd/tt" | "special rates"
  bank: string
  date: number
  IDRExchangeRate: {
    USD: Rate
    SGD: Rate
    EUR: Rate
    CNY: Rate
    GBP: Rate
    JPY: Rate
    SAR: Rate
  }
}

const client = new S3Client({ region: String(process.env.REGION) })

const getDataFromS3 = async (): Promise<ExchangeRate[]> => {
  const appEnv =
    String(process.env.APP_ENV) === "prod" || "production" ? "prod" : "dev"

  const command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: `${appEnv}/scraping/exchange-rates.json`,
  })

  try {
    const response = await client.send(command)
    const payload = await response.Body?.transformToString()

    return payload ? JSON.parse(payload) : ""
  } catch (err) {
    console.error("Error when retrieve data from S3.", err)

    throw new Error(`Cannot Get Data from S3. Error: ${err}`)
  }
}

export const handler = async (
  event: APIGatewayProxyEventV2WithRequestContext<any>,
  context: Context
) => {
  let statusCode
  let body
  const headers = {
    "Content-Type": "application/json",
  }
  try {
    const data = await getDataFromS3()
    let payload = data

    if (data.length !== 0 || data) {
      if (event.queryStringParameters) {
        // pagination
        const { page, limit } = event.queryStringParameters
        if (page && limit) {
          const start = (Number(page) - 0) * Number(limit)
          const end = start + Number(limit)
          payload = payload.slice(start, end)
        }
      }

      statusCode = 200
      body = {
        payload,
      }
    } else {
      statusCode = 404
      body = {
        message: "Data from S3 not found.",
      }
    }

    console.log(
      `[HANDLER] ${
        statusCode === 200
          ? "Success Retrieve Data from S3 and Invoke Function."
          : "Success Invoking Function but there's no data from S3."
      }`
    )

    const response = {
      isBase64Encoded: false,
      multiValueHeaders: null,
      statusCode,
      headers,
      body: JSON.stringify(body),
    }
    return response
  } catch (err) {
    console.error("[API Service]", err)
    const response = {
      statusCode: 501,
      isBase64Encoded: false,
      multiValueHeaders: null,
      headers,
      body: JSON.stringify({
        message: "Something went wrong.",
      }),
    }
    return response
  }
}

function dateParser(date: number) {
  const newDate = new Date(date)
  const day = newDate.getDate()
  const month = newDate.getMonth()
  const year = newDate.getFullYear()

  return `${day}-${month}-${year}`
}
