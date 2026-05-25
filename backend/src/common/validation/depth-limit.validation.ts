import { ValidationContext, GraphQLError, ASTVisitor } from 'graphql';

/**
 * Custom zero-dependency GraphQL query depth limiting validation rule.
 * Prevents Denial of Service (DoS) attacks from deeply nested relational queries.
 */
export function depthLimitRule(maxDepth: number) {
  return (context: ValidationContext): ASTVisitor => {
    let depth = 0;
    
    return {
      SelectionSet: {
        enter(node) {
          depth++;
          if (depth > maxDepth) {
            context.reportError(
              new GraphQLError(
                `Query exceeds maximum allowed depth of ${maxDepth}.`,
                { nodes: [node] }
              ),
            );
          }
        },
        leave() {
          depth--;
        },
      },
    };
  };
}
