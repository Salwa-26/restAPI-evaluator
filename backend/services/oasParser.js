const SwaggerParser = require('swagger-parser');
const { faker } = require('@faker-js/faker');

class OASParser {
  constructor() {
    this.api = null;
    this.baseUrl = '';
    this.existingResources = new Map(); // Cache for existing resources
  }

  async parseOAS(oasInput) {
    try {
      // Handle both URL and JSON object inputs
      let oasSource;
      if (typeof oasInput === 'string') {
        oasSource = oasInput;
      } else {
        oasSource = oasInput;
      }

      this.api = await SwaggerParser.validate(oasSource);
      
      // Determine base URL
      this.baseUrl = this.getBaseUrl();
      
      return {
        success: true,
        api: this.api,
        baseUrl: this.baseUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  getBaseUrl() {
    if (this.api.servers && this.api.servers.length > 0) {
      return this.api.servers[0].url;
    } else if (this.api.host) {
      const scheme = this.api.schemes ? this.api.schemes[0] : 'https';
      const basePath = this.api.basePath || '';
      return `${scheme}://${this.api.host}${basePath}`;
    }
    return '';
  }

  extractEndpoints() {
    const endpoints = [];
    
    if (!this.api.paths) {
      return endpoints;
    }

    Object.keys(this.api.paths).forEach(path => {
      const pathItem = this.api.paths[path];
      
      // Extract GET endpoints
      if (pathItem.get) {
        endpoints.push({
          path: path,
          method: 'GET',
          operation: pathItem.get,
          fullUrl: this.baseUrl + path
        });
      }
      
      // Extract POST endpoints
      if (pathItem.post) {
        endpoints.push({
          path: path,
          method: 'POST',
          operation: pathItem.post,
          fullUrl: this.baseUrl + path
        });
      }
    });

    return endpoints;
  }

  
  generateSmartDummyValue(paramName, schema, pathContext = '') {
    const lowerParamName = paramName.toLowerCase();
    const lowerPath = pathContext.toLowerCase();

    // Smart ID generation based on context
    if (lowerParamName.includes('id') || lowerParamName.includes('key')) {
      if (lowerPath.includes('pet') || lowerParamName.includes('pet')) {

        return faker.helpers.arrayElement([1, 2, 3, 4, 5, 10]);
      } else if (lowerPath.includes('user') || lowerParamName.includes('user')) {

        return faker.helpers.arrayElement(['user1', 'user2', 'testuser', 'john']);
      } else if (lowerPath.includes('order') || lowerParamName.includes('order')) {
   
        return faker.helpers.arrayElement([1, 2, 3, 4, 5]);
      } else {

        return faker.number.int({ min: 1, max: 10 });
      }
    }

    if (lowerParamName.includes('status')) {
      if (lowerPath.includes('pet')) {
        return faker.helpers.arrayElement(['available', 'pending', 'sold']);
      } else if (lowerPath.includes('order')) {
        return faker.helpers.arrayElement(['placed', 'approved', 'delivered']);
      }
    }

    // Tags
    if (lowerParamName.includes('tag')) {
      return faker.helpers.arrayElement(['tag1', 'tag2', 'friendly', 'cute']);
    }

    // Username
    if (lowerParamName.includes('username') || lowerParamName.includes('user')) {
      return faker.helpers.arrayElement(['user1', 'testuser', 'john', 'demo']);
    }

    // Password
    if (lowerParamName.includes('password')) {
      return 'password123';
    }

    return this.generateDummyData(schema);
  }

  generateDummyData(schema, definitions = {}) {
    if (!schema) return null;

    // Handle references
    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/definitions/', '').replace('#/components/schemas/', '');
      const refSchema = definitions[refPath] || (this.api.definitions && this.api.definitions[refPath]) || 
                       (this.api.components && this.api.components.schemas && this.api.components.schemas[refPath]);
      if (refSchema) {
        return this.generateDummyData(refSchema, definitions);
      }
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return faker.helpers.arrayElement(schema.enum);
        }
        if (schema.format) {
          switch (schema.format) {
            case 'email':
              return faker.internet.email();
            case 'date':
              return faker.date.past().toISOString().split('T')[0];
            case 'date-time':
              return faker.date.past().toISOString();
            case 'uuid':
              return faker.string.uuid();
            case 'uri':
              return faker.internet.url();
            default:
              return faker.lorem.word();
          }
        }
        return schema.example || faker.lorem.word();

      case 'integer':
      case 'number':
        if (schema.enum) {
          return faker.helpers.arrayElement(schema.enum);
        }
        const min = schema.minimum || 1;
        const max = schema.maximum || 100;
        return schema.type === 'integer' ? 
          faker.number.int({ min, max }) : 
          faker.number.float({ min, max, precision: 0.01 });

      case 'boolean':
        return faker.datatype.boolean();

      case 'array':
        if (schema.items) {
          const arrayLength = faker.number.int({ min: 1, max: 3 });
          return Array.from({ length: arrayLength }, () => 
            this.generateDummyData(schema.items, definitions)
          );
        }
        return [];

      case 'object':
        const obj = {};
        if (schema.properties) {
          Object.keys(schema.properties).forEach(prop => {
            if (schema.required?.includes(prop) || faker.datatype.boolean()) {
              obj[prop] = this.generateDummyData(schema.properties[prop], definitions);
            }
          });
        }
        return obj;

      default:
        return schema.example || faker.lorem.word();
    }
  }

  generateSmartRequestBody(schema, pathContext = '', definitions = {}) {
    if (!schema) return null;

    if (schema.$ref) {
      const refPath = schema.$ref.replace('#/definitions/', '').replace('#/components/schemas/', '');
      const refSchema = definitions[refPath] || (this.api.definitions && this.api.definitions[refPath]) || 
                       (this.api.components && this.api.components.schemas && this.api.components.schemas[refPath]);
      if (refSchema) {
        return this.generateSmartRequestBody(refSchema, pathContext, definitions);
      }
    }

    if (schema.type === 'object' && schema.properties) {
      const obj = {};
      const lowerPath = pathContext.toLowerCase();

      Object.keys(schema.properties).forEach(prop => {
        if (schema.required?.includes(prop) || Math.random() > 0.3) { 
          const propSchema = schema.properties[prop];
          const lowerProp = prop.toLowerCase();

          if (lowerPath.includes('pet') && lowerProp.includes('name')) {
            obj[prop] = faker.helpers.arrayElement(['Buddy', 'Max', 'Bella', 'Charlie', 'Lucy']);
          } else if (lowerPath.includes('pet') && lowerProp.includes('status')) {
            obj[prop] = faker.helpers.arrayElement(['available', 'pending', 'sold']);
          } else if (lowerPath.includes('pet') && lowerProp.includes('category')) {
            obj[prop] = { id: faker.number.int({min: 1, max: 5}), name: faker.helpers.arrayElement(['Dogs', 'Cats', 'Birds', 'Fish']) };
          } else if (lowerPath.includes('user') && lowerProp.includes('username')) {
            obj[prop] = faker.internet.userName().toLowerCase();
          } else if (lowerPath.includes('user') && lowerProp.includes('email')) {
            obj[prop] = faker.internet.email();
          } else if (lowerPath.includes('user') && lowerProp.includes('phone')) {
            obj[prop] = faker.phone.number();
          } else if (lowerPath.includes('order') && lowerProp.includes('quantity')) {
            obj[prop] = faker.number.int({ min: 1, max: 5 });
          } else if (lowerProp.includes('id')) {
            obj[prop] = faker.number.int({ min: 1, max: 100 });
          } else {
            obj[prop] = this.generateDummyData(propSchema, definitions);
          }
        }
      });

      return obj;
    }

    return this.generateDummyData(schema, definitions);
  }

  generateRequestData(endpoint) {
    const requestData = {
      url: endpoint.fullUrl,
      method: endpoint.method,
      headers: {
        'User-Agent': 'REST-API-Evaluator/1.0',
        'Accept': 'application/json'
      },
      params: {},
      body: null
    };

    if (endpoint.operation.parameters) {
      endpoint.operation.parameters.forEach(param => {
        if (param.in === 'path') {
          const dummyValue = this.generateSmartDummyValue(param.name, param.schema || param, endpoint.path);
          requestData.url = requestData.url.replace(`{${param.name}}`, dummyValue);
        } else if (param.in === 'query') {
          const dummyValue = this.generateSmartDummyValue(param.name, param.schema || param, endpoint.path);
          requestData.params[param.name] = dummyValue;
        } else if (param.in === 'header') {
          const dummyValue = this.generateSmartDummyValue(param.name, param.schema || param, endpoint.path);
          requestData.headers[param.name] = dummyValue;
        }
      });
    }

    // Handle Swagger 2.0 parameters 
    if (endpoint.operation.parameters) {
      endpoint.operation.parameters.forEach(param => {
        if (param.in === 'formData' && endpoint.method === 'POST') {
          if (!requestData.body) requestData.body = {};
          requestData.body[param.name] = this.generateSmartDummyValue(param.name, param, endpoint.path);
          requestData.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
      });
    }

    if (endpoint.method === 'POST' && endpoint.operation.requestBody) {
      const requestBody = endpoint.operation.requestBody;
      const content = requestBody.content;
      
      if (content['application/json']) {
        requestData.headers['Content-Type'] = 'application/json';
        const schema = content['application/json'].schema;
        requestData.body = this.generateSmartRequestBody(schema, endpoint.path, this.api.definitions || {});
      } else if (content['application/x-www-form-urlencoded']) {
        requestData.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const schema = content['application/x-www-form-urlencoded'].schema;
        requestData.body = this.generateSmartRequestBody(schema, endpoint.path, this.api.definitions || {});
      } else if (content['multipart/form-data']) {
        requestData.headers['Content-Type'] = 'multipart/form-data';
        const schema = content['multipart/form-data'].schema;
        requestData.body = this.generateSmartRequestBody(schema, endpoint.path, this.api.definitions || {});
      }
    }

    // Handle Swagger 2.0 
    if (endpoint.method === 'POST' && !requestData.body && endpoint.operation.parameters) {
      const bodyParam = endpoint.operation.parameters.find(p => p.in === 'body');
      if (bodyParam && bodyParam.schema) {
        requestData.headers['Content-Type'] = 'application/json';
        requestData.body = this.generateSmartRequestBody(bodyParam.schema, endpoint.path, this.api.definitions || {});
      }
    }

    return requestData;
  }
}

module.exports = OASParser;