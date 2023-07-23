import { App, CfnParameter, Stack, StackProps } from 'aws-cdk-lib';
import { CfnEIP, CfnInstance, CfnInternetGateway, CfnNatGateway, CfnRoute, CfnRouteTable, CfnSecurityGroup, CfnSecurityGroupIngress, CfnSubnet, CfnSubnetRouteTableAssociation, CfnVPC, CfnVPCGatewayAttachment, SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { CfnImage } from 'aws-cdk-lib/aws-imagebuilder';
// import * as sqs from 'aws-cdk-lib/aws-sqs';


const region = 'ap-northeast-1'
const availabilityZones = [`${region}a`, `${region}c`, `${region}d`]


export class VPCStack extends Stack {
  public readonly vpc: CfnVPC
  public readonly publicSubnets: CfnSubnet[]
  public readonly privateSubnets: CfnSubnet[]

  constructor(scope: App, id: string, props?: StackProps) {
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

    const subnetCount = 2

    const vpcCIDR = new CfnParameter(this, 'VPCCIDR', {
      type: 'String',
      description: 'VPC CIDR.recommend /16',
      default: '192.168.0.0/16'
    })


    const publicSubnetCIDRs = [...Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnParameter(this, `PublicSubnetCIDR${index}`, {
        type: 'String',
        description: 'VPC CIDR.recommend /24',
        default: `192.168.${index}.0/24`
      })
    })

    const privateSubnetCIDRs = [...Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnParameter(this, `PrivateSubnetCIDR${index}`, {
        type: 'String',
        description: 'VPC CIDR.recommend /24',
        default: `192.168.1${index}.0/24`
      })
    })

    // VPC
    const vpc = new CfnVPC(this, 'MyVPC', {
      cidrBlock: vpcCIDR.valueAsString,
      tags: [{ key: 'Name', value: `${profile.name}-vpc` }]
    })
    this.vpc = vpc

    const publicSubnets = [...Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnSubnet(this, `MyPublicSubnet${index}`, {
        vpcId: vpc.ref,
        cidrBlock: publicSubnetCIDRs[index].valueAsString,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: [{ key: 'Name', value: `public-subnet-${index}` }]
      })
    })
    this.publicSubnets = publicSubnets

    const privateSubnets = [...Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnSubnet(this, `MyPrivateSubnet${index}`, {
        vpcId: vpc.ref,
        cidrBlock: privateSubnetCIDRs[index].valueAsString,
        availabilityZone: availabilityZones[index],
        mapPublicIpOnLaunch: false,
        tags: [{ key: 'Name', value: `private-subnet-${index}` }]
      })
    })
    this.privateSubnets = privateSubnets

    const igw = new CfnInternetGateway(this, 'MyInternetGateWay', { tags: [{ key: 'Name', value: `igw`, }] })
    new CfnVPCGatewayAttachment(this, 'AttachGateway', {
      vpcId: vpc.ref,
      internetGatewayId: igw.ref
    })

    const publicRouteTables = [...new Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnRouteTable(this, `PublicRouteTable${index}`, {
        vpcId: vpc.ref,
        tags: [{ key: 'Name', value: `public-route-${index}`, }]
      })
    })

    const privateRouteTables = [...new Array(subnetCount)].map((_: undefined, index: number) => {
      return new CfnRouteTable(this, `PrivateRouteTable${index}`, {
        vpcId: vpc.ref,
        tags: [{ key: 'Name', value: `private-route-${index}`, }]
      })
    })

    for (let index = 0; index < subnetCount; index++) {
      new CfnSubnetRouteTableAssociation(this, `PublicSubnetRouteTableAssociation${index}`, {
        routeTableId: publicRouteTables[index].ref,
        subnetId: publicSubnets[index].ref
      })
      new CfnRoute(this, `PublicRouteToIGW${index}`, {
        routeTableId: publicRouteTables[index].ref,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.ref
      })

      new CfnSubnetRouteTableAssociation(this, `PrivateSubnetRouteTableAssociation${index}`, {
        routeTableId: privateRouteTables[index].ref,
        subnetId: privateSubnets[index].ref
      })

    }


    // // 各Subnetに、NAT GWを置くパタン
    // const eips = [...new Array(subnetCount)].map((_: undefined, index: number) => {
    //   return new CfnEIP(this, `EIPforNatGw${index}`, { domain: 'vpc' })
    // })
    // const natgws = [...new Array(subnetCount)].map((_: undefined, index: number) => {
    //   return new CfnNatGateway(this, `MyNAT${index}`, {
    //     allocationId: eips[index].attrAllocationId,
    //     subnetId: publicSubnets[index].ref
    //   })
    // })
    // for (let i = 0; i < subnetCount; i++) {
    //   new CfnRoute(this, `RouteToNAT${i}`, {
    //     routeTableId: privateRouteTables[i].ref,
    //     destinationCidrBlock: '0.0.0.0/0',
    //     natGatewayId: natgws[i].ref
    //   })
    // }
    // // 各Subnetに、NAT GWを置くパタン

    // 1Subnetに、NAT GWを置くパタン
    const eip = new CfnEIP(this, `EIPforNatGw1`, { domain: 'vpc' })
    const natgw = new CfnNatGateway(this, `MyNAT1`, {
      allocationId: eip.attrAllocationId,
      subnetId: publicSubnets[0].ref
    })

    for (let i = 0; i < subnetCount; i++) {
      new CfnRoute(this, `RouteToNAT${i}`, {
        routeTableId: privateRouteTables[i].ref,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natgw.ref
      })
    }
    // 1Subnetに、NAT GWを置くパタン
  }
}


export class EC2Stack extends Stack {
  constructor(scope: App, id: string, vpc: CfnVPC, subnet: CfnSubnet, props?: StackProps) {
    super(scope, id, props);

    const argKey = 'profile'
    const tmpStr = this.node.tryGetContext(argKey)
    const profileStr = tmpStr ? tmpStr : 'dev'
    const profile = this.node.tryGetContext(profileStr)

    const PublicSubnetEC2SecurityGroup = createSecurityGroup(this, vpc, profile)

    new CfnInstance(this, `EC2`, {
      imageId: 'ami-00d101850e971728d',
      keyName: 'temp_private',
      instanceType: 't2.micro',
      networkInterfaces: [
        {
          associatePublicIpAddress: true,
          deviceIndex: '0',
          subnetId: subnet.attrSubnetId,
          groupSet: [
            PublicSubnetEC2SecurityGroup.ref
          ]
        }
      ],
      tags: [{ key: 'Name', value: `public-ec2` }]


    })
    // 
  }
}


const createSecurityGroup = (stack: Stack, vpc: CfnVPC, profile: any): CfnSecurityGroup => {

  const group = new CfnSecurityGroup(stack, 'PublicSubnetEC2SecurityGroup', {
    groupName: 'public-ec2-sg',
    groupDescription: 'Allow SSH access from MyIP',
    vpcId: vpc.attrVpcId,
    tags: [{ key: 'Name', value: `${profile.name}-public-sg` }]
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress000', {
    ipProtocol: '-1',
    groupId: group.ref,
    sourceSecurityGroupId: group.ref
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress001', {
    ipProtocol: 'tcp',
    fromPort: 22,
    toPort: 22,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0'
  })

  new CfnSecurityGroupIngress(stack, 'PublicSubnetEC2SecurityGroupIngress002', {
    ipProtocol: 'tcp',
    fromPort: 80,
    toPort: 80,
    groupId: group.ref,
    cidrIp: '0.0.0.0/0'
  })



  return group
}

