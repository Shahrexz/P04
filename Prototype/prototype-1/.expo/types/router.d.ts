/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/CityScreen` | `/GoogleMap` | `/LoginScreen` | `/Reviews` | `/SignupScreen` | `/_sitemap` | `/components/protectedroute` | `/contexts/authcontext` | `/home` | `/styles` | `/styles/homestyles` | `/types/types`;
      DynamicRoutes: never;
      DynamicRouteTemplate: never;
    }
  }
}
