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

import _ from 'lodash';
import {Config} from '../../../utils/config';
import {View} from '../../../utils/view';
import {Page, PageOptions} from '../types';
import {ProjectStrategyFactory} from './strategy/factory';
import {ProjectStrategy} from './strategy/types';

export class Projects extends PageOptions implements Page {
  private static _projectName: string;
  private readonly _strategy: ProjectStrategy | undefined;

  readonly Buttons = new Buttons();
  readonly Elements = new Elements();

  constructor(isAPIMocked: boolean) {
    super();

    this._strategy = ProjectStrategyFactory.new(isAPIMocked);
  }

  static getName(): string {
    if (!this._projectName) {
      const prefix = 'test-project';
      this._projectName = Config.isAPIMocked() ? prefix : _.uniqueId(`${prefix}-`);
    }

    return this._projectName;
  }

  visit(): void {
    cy.visit(View.Projects.Default, {timeout: this._pageLoadTimeout});
  }

  create(name: string): void {
    this.Buttons.openDialog.click();
    this.Elements.addDialogInput.type(name);
    this.Buttons.addDialogConfirm.click().then(_ => this._strategy?.onCreate());
  }

  select(name: string): void {
    this.Elements.projectItem(name).click();
  }

  delete(name: string): void {
    this.Buttons.deleteDialog(name).click({force: true});
    this.Buttons.deleteDialogInput.type(name);
    this.Buttons.deleteDialogConfirm.click().then(_ => this._strategy?.onDelete());
  }
}

class Elements extends PageOptions {
  projectItem(name: string): Cypress.Chainable {
    return this._get(`#km-project-name-${name}`);
  }

  projectItemIcon(name: string, status: string): Cypress.Chainable {
    return this._get(`#km-project-name-${name}`).parent().find(`i.km-icon-${status}`);
  }

  get edition(): Cypress.Chainable {
    return this._get('#km-edition');
  }

  get addDialogInput(): Cypress.Chainable {
    return this._get('#km-add-project-dialog-input');
  }
}

class Buttons extends PageOptions {
  get openDialog(): Cypress.Chainable {
    return this._get('#km-add-project-top-btn');
  }

  deleteDialog(name: string): Cypress.Chainable {
    return this._get(`#km-delete-project-${name}`);
  }

  get deleteDialogInput(): Cypress.Chainable {
    return this._get('#km-delete-project-dialog-input');
  }

  get deleteDialogConfirm(): Cypress.Chainable {
    return this._get('#km-delete-project-dialog-confirm-btn');
  }

  get closeDialog(): Cypress.Chainable {
    return this._get('#km-close-dialog-btn');
  }

  get addDialogConfirm(): Cypress.Chainable {
    return this._get('#km-add-project-dialog-save');
  }
}
