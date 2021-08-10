import { ICredentialType, NodePropertyTypes } from 'n8n-workflow';

export class PerfectMindApi implements ICredentialType {
	name = 'PerfectMindApi';
	displayName = 'PerfectMind API';
	documentationUrl = 'PerfectMind';
	properties = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string' as NodePropertyTypes,
			default: '',
			required: true
		},
		{
			displayName: 'API Version',
			name: 'apiVersion',
			type: 'string' as NodePropertyTypes,
			default: '2.0'
		},
		{
			displayName: 'Client Number',
			name: 'clientNumber',
			type: 'string' as NodePropertyTypes,
			default: ''
		},
		{
			displayName: 'Username',
			name: 'username',
			type: 'string' as NodePropertyTypes,
			default: ''
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string' as NodePropertyTypes,
			typeOptions: {
				password: true
			},
			default: ''
		},
		{
			displayName: 'Sub Domain',
			name: 'subDomain',
			type: 'string' as NodePropertyTypes,
			default: ''
		}
	];
}
