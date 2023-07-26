import { CfnResource, Stack } from 'aws-cdk-lib'
import { CfnSubnet } from 'aws-cdk-lib/aws-ec2'

export const region = 'ap-northeast-1'
export const availabilityZones = [`${region}a`, `${region}c`, `${region}d`]

export const getProfile = (stack: Stack): any => {
  const argKey = 'profile'
  const tmpStr = stack.node.tryGetContext(argKey)
  const profileStr = tmpStr ? tmpStr : 'dev'
  return stack.node.tryGetContext(profileStr)
}

// export const toSubnetRefs = (subnets: CfnSubnet[]): string[] => subnets.map((subnet) => subnet.ref)

export const toRefs = (instances: CfnResource[]): string[] => instances.map((instance) => instance.ref)
