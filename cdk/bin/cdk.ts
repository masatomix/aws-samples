#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { VPCStack } from '../lib/cdk-stack'
import { EC2Stack /*EC2Stack1*/ } from '../lib/EC2Stack'
import { ELBStack } from '../lib/ELB'

const app = new cdk.App()
const vpcStack = new VPCStack(app, 'VPCStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */
  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },
  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
})

new EC2Stack(app, 'EC2Stack', vpcStack.vpc, vpcStack.publicSubnets, vpcStack.privateSubnets)

new ELBStack(app, 'ELBStack', vpcStack.vpc, vpcStack.publicSubnets)
// new EC2Stack1(app, 'EC2Stack1', vpcStack.vpc, vpcStack.publicSubnets, vpcStack.privateSubnets)
