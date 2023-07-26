import { App, CfnParameter, Stack, StackProps } from 'aws-cdk-lib'
import {
  CfnInstance,
  CfnSecurityGroup,
  CfnSecurityGroupIngress,
  CfnSubnet,
  CfnVPC,
} from 'aws-cdk-lib/aws-ec2'
import { getProfile } from './Utils'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class EC2Stack extends Stack {
  constructor(
    scope: App,
    id: string,
    vpc: CfnVPC,
    publicSubnets: CfnSubnet[],
    privateSubnets: CfnSubnet[],
    props?: StackProps,
  ) {
    super(scope, id, props)
    const profile = getProfile(this)

    const PublicSubnetEC2SecurityGroup = createSecurityGroup(this, vpc, profile)

    for (let i = 0; i < publicSubnets.length; i++) {
      createEC2(this, vpc, publicSubnets[i], [PublicSubnetEC2SecurityGroup.ref], true, profile, `ec2-public-${i}`)
      createEC2(this, vpc, privateSubnets[i], [PublicSubnetEC2SecurityGroup.ref], false, profile, `ec2-private-${i}`)
    }
  }
}

// export class EC2Stack1 extends Stack {
//   constructor(
//     scope: App,
//     id: string,
//     vpc: CfnVPC,
//     publicSubnets: CfnSubnet[],
//     privateSubnets: CfnSubnet[],
//     props?: StackProps,
//   ) {
//     super(scope, id, props)

//     const profile = getProfile(this)

//     const PublicSubnetEC2SecurityGroup = createSecurityGroup(this, vpc, profile)
//     createEC21(this, vpc, [PublicSubnetEC2SecurityGroup.ref], true, profile, `ec2-public`)
//   }
// }



const createEC2 = (
  stack: Stack,
  vpc: CfnVPC,
  subnet: CfnSubnet,
  groupSet: string[],
  associatePublicIpAddress: boolean,
  profile: any,
  name: string,
): CfnInstance => {
  return new CfnInstance(stack, `EC2${name}`, {
    imageId: 'ami-00d101850e971728d',
    keyName: 'temp_private',
    instanceType: 't2.micro',
    networkInterfaces: [
      {
        associatePublicIpAddress,
        deviceIndex: '0',
        subnetId: subnet.attrSubnetId,
        groupSet,
      },
    ],
    tags: [{ key: 'Name', value: `${name}-ec2` }],
  })
}
// const createEC21 = (
//   stack: Stack,
//   vpc: CfnVPC,
//   groupSet: string[],
//   associatePublicIpAddress: boolean,
//   profile: any,
//   name: string,
// ): CfnInstance => {
//   return new CfnInstance(stack, `EC2${name}`, {
//     imageId: 'ami-00d101850e971728d',
//     keyName: 'temp_private',
//     instanceType: 't2.micro',
//     networkInterfaces: [
//       {
//         associatePublicIpAddress,
//         deviceIndex: '0',
//         subnetId: 'subnet-0b09d2443014e57ed',
//         groupSet,
//       },
//     ],
//     tags: [{ key: 'Name', value: `${name}-ec2` }],
//   })
// }

const createSecurityGroup = (stack: Stack, vpc: CfnVPC, profile: any): CfnSecurityGroup => {
  const group = new CfnSecurityGroup(stack, 'PublicSubnetEC2SecurityGroup', {
    groupName: 'public-ec2-sg',
    groupDescription: 'Allow SSH access from MyIP',
    vpcId: vpc.attrVpcId,
    tags: [{ key: 'Name', value: `${profile.name}-public-sg` }],
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress000', {
    ipProtocol: '-1',
    groupId: group.ref,
    sourceSecurityGroupId: group.ref,
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress001', {
    ipProtocol: 'tcp',
    fromPort: 22,
    toPort: 22,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0',
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress002', {
    ipProtocol: 'tcp',
    fromPort: 80,
    toPort: 80,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0',
  })

  return group
}
