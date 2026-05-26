import { parse, validate, buildSchema, ValidationRule } from 'graphql';
import { depthLimitRule } from './depth-limit.validation';

describe('depthLimitRule', () => {
  const schema = buildSchema(`
    type User {
      id: ID!
      name: String!
      projects: [Project!]!
    }

    type Project {
      id: ID!
      name: String!
      tasks: [Task!]!
    }

    type Task {
      id: ID!
      title: String!
      assignee: User!
    }

    type Query {
      me: User!
    }
  `);

  const runValidation = (queryStr: string, rules: ValidationRule[]) => {
    const document = parse(queryStr);
    return validate(schema, document, rules);
  };

  it('should pass for queries within depth limit', () => {
    const query = `
      query {
        me {
          name
          projects {
            name
          }
        }
      }
    `;

    const errors = runValidation(query, [depthLimitRule(4)]);
    expect(errors).toHaveLength(0);
  });

  it('should fail for queries exceeding depth limit', () => {
    const query = `
      query {
        me {
          projects {
            tasks {
              assignee {
                name
              }
            }
          }
        }
      }
    `;

    const errors = runValidation(query, [depthLimitRule(3)]);
    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0].message).toContain(
      'Query exceeds maximum allowed depth of 3',
    );
  });
});
