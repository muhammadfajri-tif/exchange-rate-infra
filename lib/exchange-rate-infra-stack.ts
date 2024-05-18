import { Stack, StackProps } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { APIServiceStack, APIServiceStackProps } from './api-service';

export interface ExchangeRateInfraStackProps extends StackProps {
  apiServiceConfig: APIServiceStackProps
}

export class ExchangeRateInfraStack extends Stack {
  public readonly apiService: APIServiceStack

  constructor(scope: Construct, id: string, props: ExchangeRateInfraStackProps) {
    super(scope, id, props);

    const { apiServiceConfig } = props

    // API Service
    this.apiService = new APIServiceStack(this, "ApiService", apiServiceConfig)
  }
}
