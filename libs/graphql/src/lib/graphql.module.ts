import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import {
  ApolloCache,
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
  split,
} from '@apollo/client/core';
import { WebSocketLink } from '@apollo/client/link/ws';
import { getMainDefinition, getOperationName } from '@apollo/client/utilities';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { BatchOptions, HttpBatchLink, HttpBatchLinkHandler } from 'apollo-angular/http';
import { UploadLinkOptions, createUploadLink } from 'apollo-upload-client';
import { OperationDefinitionNode } from 'graphql';
import { SubscriptionClient } from 'subscriptions-transport-ws';

export abstract class GraphQLOptions {
  resolvers?: any;
  cache?: ApolloCache<any>;
  uploadOptions?: UploadLinkOptions & { mutations: string[] };
  batchOptions?: BatchOptions;
  websocketOptions?: WebSocketLink.Configuration;
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpBatchLink, [new Optional(), GraphQLOptions]],
    },
  ],
})
export class GraphQLModule {
  static subscriptionClient: SubscriptionClient | null = null;

  constructor(@Optional() @SkipSelf() parentModule?: GraphQLModule) {
    if (parentModule) {
      throw new Error('GraphQLModule is already loaded. Import it in the AppModule only.');
    }
  }

  static forRoot(options?: GraphQLOptions): ModuleWithProviders<GraphQLModule> {
    return {
      ngModule: GraphQLModule,
      providers: [
        {
          provide: GraphQLOptions,
          useValue: options,
        },
      ],
    };
  }

  static reconnectSubscriptionClient() {
    if (this.subscriptionClient) {
      this.subscriptionClient.close(true, true);
      (<any>this.subscriptionClient).connect();
      console.log('Re-connected websocket for subscription client for GraphQL');
    }
  }
}

export function createApollo(
  httpBatchLink: HttpBatchLink,
  options: GraphQLOptions | undefined
): ApolloClientOptions<any> {
  let link: ApolloLink;

  let batch_link: HttpBatchLinkHandler;
  if (options?.batchOptions) batch_link = httpBatchLink.create(options.batchOptions);
  else throw Error('No GraphQLOptions.batchOptions provided');

  if (!options) {
    link = batch_link;
  } else {
    if (options.websocketOptions) {
      const websocket_link = new WebSocketLink(options.websocketOptions);

      GraphQLModule.subscriptionClient = (<any>websocket_link).subscriptionClient;

      const websocket_batch_link = split(
        ({ query }) => {
          const { kind, operation } = getMainDefinition(query) as OperationDefinitionNode;
          return kind === 'OperationDefinition' && operation === 'subscription';
        },
        websocket_link,
        batch_link
      );

      if (!options.uploadOptions) {
        link = websocket_batch_link;
      } else {
        const upload_link = createUploadLink(options.uploadOptions);

        const upload_websocket_batch_link = split(
          ({ query }) =>
            (options.uploadOptions?.mutations as string[])?.includes(
              getOperationName(query) as string
            ),
          upload_link,
          websocket_batch_link
        );

        link = upload_websocket_batch_link;
      }
    } else {
      if (!options.uploadOptions) {
        link = batch_link;
      } else {
        const upload_link = createUploadLink(options.uploadOptions);

        const upload_batch_link = split(
          ({ query }) =>
            (options.uploadOptions?.mutations as string[])?.includes(
              getOperationName(query) as string
            ),
          upload_link,
          batch_link
        );

        link = upload_batch_link;
      }
    }
  }

  return {
    link,
    cache: options?.cache ? options.cache : new InMemoryCache(),
    resolvers: options?.resolvers,
  };
}
