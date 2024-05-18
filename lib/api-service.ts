import { Duration, Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { aws_apigatewayv2 as apigw } from 'aws-cdk-lib'
import { aws_lambda_nodejs as nodejs } from 'aws-cdk-lib'
import { aws_s3 as s3 } from 'aws-cdk-lib'
import { RetentionDays } from 'aws-cdk-lib/aws-logs'
import { Runtime } from 'aws-cdk-lib/aws-lambda'
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'

export interface APIServiceStackProps extends StackProps {
  appEnv: 'prod' | 'production' | 'dev' | 'development';
  bucketName: string;
}

export class APIServiceStack extends Stack {
  public readonly lambda: nodejs.NodejsFunction;
  public readonly apiGateway: apigw.HttpApi

  constructor(scope: Construct, id: string, props: APIServiceStackProps) {
    super(scope, id, props);

    // import existing bucket
    const s3Bucket = s3.Bucket.fromBucketAttributes(this, 'ExchangeRateBucket', {
      bucketArn: `arn:aws:s3:::${props.bucketName}`,
    })

    // set lambda
    this.lambda = new nodejs.NodejsFunction(this, 'handler', {
      functionName: "api-service_exchange-rate",
      description: "Function API Service for Exchange Rate App",
      runtime: Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(60),
      logRetention: RetentionDays.ONE_WEEK,
      environment: {
        "APP_ENV": props.appEnv,
        "BUCKET_NAME": props.bucketName,
        "REGION": props.env?.region!
      }
    })

    // add lambda permission to access s3
    s3Bucket.grantRead(this.lambda)

    // create lambda integration to api gateway
    const lambdaIntegration = new HttpLambdaIntegration('LambdaAPIIntegration', this.lambda)

    // define api gateway
    this.apiGateway = new apigw.HttpApi(this, 'HttpApi', {
      apiName: "exchange-rate-api",
      description: "API Gateway for API Service Exchange Rate App",
      defaultIntegration: lambdaIntegration
    })
  }
}
