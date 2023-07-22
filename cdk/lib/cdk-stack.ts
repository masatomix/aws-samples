import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnVPC } from 'aws-cdk-lib/aws-ec2'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const argKey = 'profile'
    const tmpStr = this.node.tryGetContext(argKey)
    const profileStr = tmpStr ? tmpStr : 'dev'
    const profile = this.node.tryGetContext(profileStr)

    // console.log('--')
    // console.log(profileStr)
    // console.log(profile)
    // console.log(profile.name)
    // console.log(profile['name'])
    // console.log('--')

    // VPC
    const vpc = new CfnVPC(this, `${profile.name}-VPC`, {
      // cfnのリソース名
      cidrBlock: '192.168.0.0/16',
      tags: [
        {
          key: 'Name',
          value: `${profile.name}-vpc`,
        },
      ],
    })
  }
}
