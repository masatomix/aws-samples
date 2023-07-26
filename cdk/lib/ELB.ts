import { App, CfnParameter, CfnResource, Stack, StackProps } from 'aws-cdk-lib'
import { CfnInstance, CfnSecurityGroup, CfnSecurityGroupIngress, CfnSubnet, CfnVPC } from 'aws-cdk-lib/aws-ec2'
import { getProfile, toRefs } from './Utils'
import { CfnLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ELBStack extends Stack {
  public readonly ECSSecurityGroup: CfnSecurityGroup
  constructor(scope: App, id: string, vpc: CfnVPC, subnets: CfnSubnet[], props?: StackProps) {
    super(scope, id, props)
    const profile = getProfile(this)

    const ALBSecurityGroup = createALBSecurityGroup(this, `${profile.name}-ALBSecurityGroup`, vpc, profile)
    const ECSSecurityGroup = createECSSecurityGroup(
      this,
      `${profile.name}-ECSSecurityGroup`,
      vpc,
      ALBSecurityGroup,
      profile,
    )
    this.ECSSecurityGroup = ECSSecurityGroup

    new CfnLoadBalancer(this, `${profile.name}-ALB`, {
      type: 'application',
      name: `${profile.name}-ALB`,
      securityGroups: toRefs([ALBSecurityGroup]),
      subnets: toRefs(subnets),
    })
  }
}

const createALBSecurityGroup = (stack: Stack, id: string, vpc: CfnVPC, profile: any): CfnSecurityGroup => {
  const group = new CfnSecurityGroup(stack, id, {
    groupName: `${profile.name}-alb-sg`,
    groupDescription: 'alb-sg',
    vpcId: vpc.attrVpcId,
    tags: [{ key: 'Name', value: `${profile.name}-ALB-sg` }],
  })

  new CfnSecurityGroupIngress(stack, 'ALBSecurityGroupIngress000', {
    ipProtocol: '-1',
    groupId: group.ref,
    sourceSecurityGroupId: group.ref,
  })

  new CfnSecurityGroupIngress(stack, 'ALBSecurityGroupIngress001', {
    ipProtocol: 'tcp',
    fromPort: 8080,
    toPort: 8088,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0',
  })

  new CfnSecurityGroupIngress(stack, 'ALBSecurityGroupIngress002', {
    ipProtocol: 'tcp',
    fromPort: 9080,
    toPort: 9088,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0',
  })

  return group
}

const createECSSecurityGroup = (
  stack: Stack,
  id: string,
  vpc: CfnVPC,
  albsg: CfnSecurityGroup,
  profile: any,
): CfnSecurityGroup => {
  const group = new CfnSecurityGroup(stack, id, {
    groupName: `${profile.name}-ecs-sg`,
    groupDescription: 'ecs-sg',
    vpcId: vpc.attrVpcId,
    tags: [{ key: 'Name', value: `${profile.name}-ECS-sg` }],
  })

  new CfnSecurityGroupIngress(stack, 'ECSSecurityGroupIngress000', {
    ipProtocol: '-1',
    groupId: group.ref,
    sourceSecurityGroupId: group.ref,
  })
  new CfnSecurityGroupIngress(stack, 'ECSSecurityGroupIngress001', {
    ipProtocol: '-1',
    groupId: group.ref,
    sourceSecurityGroupId: albsg.ref,
  })

  return group
}
