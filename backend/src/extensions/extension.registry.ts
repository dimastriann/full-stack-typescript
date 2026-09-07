import { Injectable } from '@nestjs/common';

export interface CoreExtension {
  name: string;
  initialize?(): void | Promise<void>;
}

@Injectable()
export class ExtensionRegistry {
  private readonly extensions = new Map<string, CoreExtension>();

  register(extension: CoreExtension): void {
    if (this.extensions.has(extension.name)) {
      throw new Error(`Extension already registered: ${extension.name}`);
    }
    this.extensions.set(extension.name, extension);
  }

  get(name: string): CoreExtension | undefined {
    return this.extensions.get(name);
  }

  list(): CoreExtension[] {
    return [...this.extensions.values()];
  }
}
