import type { ComponentType } from 'react';

export interface FrontendRouteExtension {
  path: string;
  component: ComponentType;
}

export interface FrontendNavigationExtension {
  label: string;
  path: string;
  order?: number;
}

class ExtensionRegistry {
  private routes: FrontendRouteExtension[] = [];
  private navigation: FrontendNavigationExtension[] = [];

  registerRoute(extension: FrontendRouteExtension): void {
    if (this.routes.some((route) => route.path === extension.path)) {
      throw new Error(`Route extension already registered: ${extension.path}`);
    }
    this.routes.push(extension);
  }

  registerNavigation(extension: FrontendNavigationExtension): void {
    if (this.navigation.some((item) => item.path === extension.path)) {
      throw new Error(
        `Navigation extension already registered: ${extension.path}`,
      );
    }
    this.navigation.push(extension);
    this.navigation.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  getRoutes(): readonly FrontendRouteExtension[] {
    return this.routes;
  }

  getNavigation(): readonly FrontendNavigationExtension[] {
    return this.navigation;
  }
}

export const frontendExtensions = new ExtensionRegistry();
