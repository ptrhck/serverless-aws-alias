'use strict';
/**
 * Unit tests for plugin class.
 */

const BbPromise = require('bluebird');
const getInstalledPath = require('get-installed-path');
const chai = require('chai');
const sinon = require('sinon');
const AwsAlias = require('../index');

const serverlessPath = getInstalledPath.sync('serverless', { local: true });
const AwsProvider = require(`${serverlessPath}/lib/plugins/aws/provider/awsProvider`);
const Serverless = require(`${serverlessPath}/lib/Serverless`);

chai.use(require('chai-as-promised'));
chai.use(require('sinon-chai'));
const expect = chai.expect;

describe('AwsAlias', () => {
	let serverless;
	let options;

	beforeEach(() => {
		serverless = new Serverless();
		options = {
			stage: 'myStage',
			region: 'us-east-1',
		};
		serverless.service.service = 'myService';
		serverless.setProvider('aws', new AwsProvider(serverless));
	});

	describe('constructor', () => {
		it('should initialize the plugin without options', () => {
			const awsAlias = new AwsAlias(serverless, {});

			expect(awsAlias).to.have.property('_serverless', serverless);
			expect(awsAlias).to.have.property('_options').to.deep.equal({});
			expect(awsAlias).to.have.property('_stage', 'dev');
			expect(awsAlias).to.have.property('_alias', 'dev');
		});

		it('should initialize the plugin with options', () => {
			const awsAlias = new AwsAlias(serverless, options);

			expect(awsAlias).to.have.property('_serverless', serverless);
			expect(awsAlias).to.have.property('_options').to.deep.equal(options);
			expect(awsAlias).to.have.property('_stage', 'myStage');
			expect(awsAlias).to.have.property('_alias', 'myStage');
		});
	});

	it('should expose standard properties', () => {
		const awsAlias = new AwsAlias(serverless, options);

		expect(awsAlias).to.have.property('serverless', serverless);
		expect(awsAlias).to.have.property('options').to.deep.equal(options);
		expect(awsAlias).to.have.property('stackName', 'myService-dev');
		expect(awsAlias).to.have.deep.property('serverless.service.provider.alias', 'myStage');
		expect(awsAlias).to.have.property('commands', awsAlias._commands);
		expect(awsAlias).to.have.property('hooks', awsAlias._hooks);
		expect(awsAlias).to.have.property('provider', awsAlias._provider);
	});

	describe('hook', () => {
		let sandbox;
		let awsAlias;
		let validateStub;
		let configureAliasStackStub;
		let createAliasStackStub;
		let aliasStackLoadCurrentCFStackAndDependenciesStub;
		let aliasRestructureStackStub;

		before(() => {
			sandbox = sinon.sandbox.create();
			awsAlias = new AwsAlias(serverless, options);
		});

		beforeEach(() => {
			validateStub = sandbox.stub(awsAlias, 'validate');
			configureAliasStackStub = sandbox.stub(awsAlias, 'configureAliasStack');
			createAliasStackStub = sandbox.stub(awsAlias, 'createAliasStack');
			aliasStackLoadCurrentCFStackAndDependenciesStub = sandbox.stub(awsAlias, 'aliasStackLoadCurrentCFStackAndDependencies');
			aliasRestructureStackStub = sandbox.stub(awsAlias, 'aliasRestructureStack');
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('before:deploy:initialize should resolve', () => {
			validateStub.returns(BbPromise.resolve());
			return expect(awsAlias.hooks['before:deploy:initialize']()).to.eventually.be.fulfilled
			.then(() => expect(validateStub).to.be.calledOnce);
		});

		it('after:deploy:initialize should resolve', () => {
			configureAliasStackStub.returns(BbPromise.resolve());
			return expect(awsAlias.hooks['after:deploy:initialize']()).to.eventually.be.fulfilled
			.then(() => expect(configureAliasStackStub).to.be.calledOnce);
		});

		it('after:deploy:setupProviderConfiguration should resolve', () => {
			createAliasStackStub.returns(BbPromise.resolve());
			return expect(awsAlias.hooks['after:deploy:setupProviderConfiguration']()).to.eventually.be.fulfilled
			.then(() => expect(createAliasStackStub).to.be.calledOnce);
		});

		it('before:deploy:deploy should resolve', () => {
			aliasStackLoadCurrentCFStackAndDependenciesStub.returns(BbPromise.resolve([]));
			aliasRestructureStackStub.returns(BbPromise.resolve());
			return expect(awsAlias.hooks['before:deploy:deploy']()).to.eventually.be.fulfilled
			.then(() => BbPromise.join(
				expect(aliasStackLoadCurrentCFStackAndDependenciesStub).to.be.calledOnce,
				expect(aliasRestructureStackStub).to.be.calledOnce
			));
		});
	});
});
