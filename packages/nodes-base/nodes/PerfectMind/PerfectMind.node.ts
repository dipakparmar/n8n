import { IExecuteFunctions } from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription
} from 'n8n-workflow';

import { OptionsWithUri } from 'request';

export class PerfectMind implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PerfectMind',
		name: 'PerfectMind',
		icon: 'file:PerfectMind.png',
		group: ['transform'],
		version: 1,
		description: "Connect to PerfectMind's API",
		defaults: {
			name: 'PerfectMind',
			color: '#003594'
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'PerfectMindApi',
				required: true
			}
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Contact',
						value: 'contact'
					},
					{
						name: 'Appointment',
						value: 'appointment'
					}
				],
				default: 'appointment',
				required: true,
				description: 'Contacts in PerfectMind'
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['contact', 'appointment']
					}
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create the resource'
					},
					{
						name: 'Update',
						value: 'update',
						description: 'Update the resource'
					},
					{
						name: 'Get',
						value: 'get',
						description: 'Get the resource'
					}
				],
				default: 'get',
				description: 'The default operation to perform.'
			},

			{
				displayName: 'Records Per Page',
				name: 'recordsPerPage',
				type: 'string',
				default: '100',
				displayOptions: {
					show: {
						resource: ['contact', 'appointment']
					}
				}
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: '0',
				displayOptions: {
					show: {
						resource: ['contact', 'appointment']
					}
				}
			},
			{
				displayName: 'Start Date/Time',
				name: 'startTime',
				type: 'dateTime',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['contact', 'appointment']
					}
				}
			},
			{
				displayName: 'End Date/Time',
				name: 'endTime',
				type: 'dateTime',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['contact', 'appointment']
					}
				}
			}
		]
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		let responseData;
		const returnData = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const pageSize = this.getNodeParameter('recordsPerPage', 0) as string;
		const page = this.getNodeParameter('page', 0) as string;
		const startTime = this.getNodeParameter('startTime', 0) as string;
		const endTime = this.getNodeParameter('endTime', 0) as string;
		//Get credentials the user provided for this node
		const credentials = this.getCredentials('PerfectMindApi') as IDataObject;

		for (let i = 0; i < items.length; i++) {
			if (resource === 'appointment') {
				if (operation === 'get') {
					// get email input
					// const email = this.getNodeParameter('email', i) as string;

					// i = 1 returns ricardo@n8n.io
					// i = 2 returns hello@n8n.io

					// get additional fields input
					// const additionalFields = this.getNodeParameter(
					// 	'additionalFields',
					// 	i
					// ) as IDataObject;
					const data: IDataObject = {
						// email
					};

					Object.assign(data);

					//Make http request according to <https://sendgrid.com/docs/api-reference/>
					const options: OptionsWithUri = {
						headers: {
							Accept: 'application/json',
							'X-Client-Number': credentials.clientNumber,
							'X-Username': credentials.username,
							'X-Password': credentials.password,
							'X-Access-Key': credentials.apiKey
						},
						method: 'GET',
						uri: `https://${credentials.subDomain}.perfectmind.com/api/${credentials.apiVersion}/Organizations/${credentials.clientNumber}/Appointments?startTime=${startTime}&endTime=${endTime}&page=${page}&pageSize=${pageSize}`,
						json: true
					};

					responseData = await this.helpers.request(options);
					returnData.push(responseData.Result);
				}
			}
		}
		// Map data to n8n data structure
		// return [this.helpers.returnJsonArray(returnData)];
		return [this.helpers.returnJsonArray(returnData)];
	}
}
