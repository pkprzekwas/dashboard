// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Config} from '../../utils/config';

export interface Page {
  visit(): void;
}

export abstract class PageOptions {
  protected _get(selector: string, timeout = this._elementLoadTimeout): Cypress.Chainable {
    return cy.get(selector, {timeout});
  }

  protected _contains(match: string): Cypress.Chainable {
    return cy.contains(match, {timeout: this._elementLoadTimeout});
  }

  constructor(
    protected readonly _elementLoadTimeout = Config.defaultElementLoadTimeout,
    protected readonly _pageLoadTimeout = Config.defaultPageLoadTimeout
  ) {}
}
