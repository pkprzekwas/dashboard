// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {MatDialog, MatDialogConfig} from '@angular/material/dialog';
import {ActivatedRoute, Router} from '@angular/router';
import {EditProviderSettingsComponent} from '@app/cluster/details/cluster/edit-provider-settings/component';
import {AppConfigService} from '@app/config.service';
import {AddonService} from '@core/services/addon';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {MLAService} from '@core/services/mla';
import {NodeService} from '@core/services/node';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {PathParam} from '@core/services/params';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {ConfirmationDialogComponent} from '@shared/components/confirmation-dialog/component';
import {Addon} from '@shared/entity/addon';
import {
  Cluster,
  CNIPlugin,
  CNIPluginVersions,
  ExternalCCMMigrationStatus,
  getExternalCCMMigrationStatusMessage,
  MasterVersion,
  Provider,
} from '@shared/entity/cluster';
import {View} from '@shared/entity/common';
import {Datacenter, SeedSettings} from '@shared/entity/datacenter';
import {Event} from '@shared/entity/event';
import {Health, HealthState, HealthType} from '@shared/entity/health';
import {MachineDeployment} from '@shared/entity/machine-deployment';
import {Member} from '@shared/entity/member';
import {ClusterMetrics} from '@shared/entity/metrics';
import {AlertmanagerConfig, RuleGroup} from '@shared/entity/mla';
import {Node} from '@shared/entity/node';
import {Constraint, GatekeeperConfig} from '@shared/entity/opa';
import {SSHKey} from '@shared/entity/ssh-key';
import {Config, GroupConfig} from '@shared/model/Config';
import {AdmissionPlugin, AdmissionPluginUtils} from '@shared/utils/admission-plugin';
import {MemberUtils, Permission} from '@shared/utils/member';
import _ from 'lodash';
import {combineLatest, iif, Observable, of, Subject} from 'rxjs';
import {filter, map, switchMap, take, takeUntil} from 'rxjs/operators';
import {coerce, compare} from 'semver';
import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation/component';
import {EditClusterComponent} from './edit-cluster/component';
import {EditSSHKeysComponent} from './edit-sshkeys/component';
import {RevokeTokenComponent} from './revoke-token/component';
import {ShareKubeconfigComponent} from './share-kubeconfig/component';
import {
  getClusterHealthStatus,
  HealthStatus,
  isClusterAPIRunning,
  isClusterRunning,
  isOPARunning,
} from '@shared/utils/health-status';

@Component({
  selector: 'km-cluster-details',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
})
export class ClusterDetailsComponent implements OnInit, OnDestroy {
  private _unsubscribe: Subject<void> = new Subject<void>();
  private _user: Member;
  private _currentGroupConfig: GroupConfig;
  private _seedSettings: SeedSettings;

  readonly HealthType = HealthType;

  externalCCMMigrationStatus = ExternalCCMMigrationStatus;
  cluster: Cluster;
  nodeDc: Datacenter;
  seed: string;
  sshKeys: SSHKey[] = [];
  nodes: Node[] = [];
  machineDeployments: MachineDeployment[];
  areMachineDeploymentsInitialized = false;
  isClusterRunning = false;
  isClusterAPIRunning = false;
  isOPARunning = false;
  healthStatus: HealthStatus;
  health: Health;
  config: Config = {share_kubeconfig: false};
  projectID: string;
  metrics: ClusterMetrics;
  events: Event[] = [];
  addons: Addon[] = [];
  upgrades: MasterVersion[] = [];
  cniVersions: string[] = [];
  constraints: Constraint[] = [];
  gatekeeperConfig: GatekeeperConfig;
  alertmanagerConfig: AlertmanagerConfig;
  ruleGroups: RuleGroup[];
  onExpandChange$ = new EventEmitter<boolean>();

  get admissionPlugins(): string[] {
    return Object.keys(AdmissionPlugin);
  }

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _clusterService: ClusterService,
    private readonly _machineDeploymentService: MachineDeploymentService,
    private readonly _addonService: AddonService,
    private readonly _matDialog: MatDialog,
    private readonly _datacenterService: DatacenterService,
    private readonly _appConfigService: AppConfigService,
    private readonly _node: NodeService,
    private readonly _userService: UserService,
    private readonly _notificationService: NotificationService,
    private readonly _opaService: OPAService,
    private readonly _mlaService: MLAService,
    readonly settings: SettingsService
  ) {}

  ngOnInit(): void {
    this.config = this._appConfigService.getConfig();
    this.projectID = this._route.snapshot.paramMap.get(PathParam.ProjectID);
    const clusterID = this._route.snapshot.paramMap.get(PathParam.ClusterID);

    this._userService.currentUser.pipe(take(1)).subscribe(user => (this._user = user));

    this._userService
      .getCurrentUserGroup(this.projectID)
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(userGroup => (this._currentGroupConfig = this._userService.getCurrentUserGroupConfig(userGroup)));

    this._clusterService
      .cluster(this.projectID, clusterID)
      .pipe(
        switchMap(cluster => {
          this.cluster = cluster;
          return this._datacenterService.getDatacenter(cluster.spec.cloud.dc);
        })
      )
      .pipe(
        switchMap(datacenter => {
          this.nodeDc = datacenter;
          this.seed = datacenter.spec.seed;

          return combineLatest([
            this._clusterService.sshKeys(this.projectID, this.cluster.id),
            this._clusterService.health(this.projectID, this.cluster.id),
            this._clusterService.events(this.projectID, this.cluster.id),
            this._datacenterService.seedSettings(this.seed),
          ]);
        })
      )
      .pipe(
        switchMap(([keys, health, events, seedSettings]) => {
          this.sshKeys = _.sortBy(keys, k => k.name.toLowerCase());
          this.health = health;
          this.events = events;
          this._seedSettings = seedSettings;
          this.isClusterAPIRunning = isClusterAPIRunning(this.cluster, health);
          this.isClusterRunning = isClusterRunning(this.cluster, health);
          this.healthStatus = getClusterHealthStatus(this.cluster, health);
          this.isOPARunning = isOPARunning(this.cluster, health);
          this.onExpandChange$.next(!this.isClusterRunning);

          // Conditionally create an array of observables to use for 'combineLatest' operator.
          // In case real observable should not be returned, observable emitting empty array will be added to the array.
          const reload$ = []
            .concat(
              this._canReloadVersions()
                ? [
                    this._clusterService.upgrades(this.projectID, this.cluster.id),
                    this._clusterService.cniVersions(this.projectID, this.cluster.id),
                  ]
                : [of([] as MasterVersion[]), of({} as CNIPluginVersions)]
            )
            .concat(
              this.isClusterRunning
                ? [
                    this._addonService.list(this.projectID, this.cluster.id),
                    this._clusterService.nodes(this.projectID, this.cluster.id),
                    this._machineDeploymentService.list(this.cluster.id, this.projectID),
                    this._clusterService.metrics(this.projectID, this.cluster.id),
                  ]
                : [of([] as Addon[]), of([] as Node[]), of([] as MachineDeployment[]), of({} as ClusterMetrics)]
            )
            .concat(
              this.isClusterRunning && this.isMLAEnabled()
                ? [
                    this._mlaService.alertmanagerConfig(this.projectID, this.cluster.id),
                    this._mlaService.ruleGroups(this.projectID, this.cluster.id),
                  ]
                : [of([]), of([] as RuleGroup[])]
            )
            .concat(
              this.isClusterRunning && this.isOPARunning && this.cluster.spec.opaIntegration?.enabled
                ? [
                    this._opaService.constraints(this.projectID, this.cluster.id),
                    this._opaService.gatekeeperConfig(this.projectID, this.cluster.id),
                  ]
                : [of([] as Constraint[]), of({} as GatekeeperConfig)]
            ) as [
            Observable<MasterVersion[]>,
            Observable<CNIPluginVersions>,
            Observable<Addon[]>,
            Observable<Node[]>,
            Observable<MachineDeployment[]>,
            Observable<ClusterMetrics>,
            Observable<AlertmanagerConfig>,
            Observable<RuleGroup[]>,
            Observable<Constraint[]>,
            Observable<GatekeeperConfig>
          ];

          return combineLatest(reload$);
        })
      )
      .pipe(takeUntil(this._unsubscribe))
      .subscribe({
        next: ([
          upgrades,
          cniVersions,
          addons,
          nodes,
          machineDeployments,
          metrics,
          alertmanagerConfig,
          ruleGroups,
          constraints,
          gatekeeperConfig,
        ]: [
          MasterVersion[],
          CNIPluginVersions,
          Addon[],
          Node[],
          MachineDeployment[],
          ClusterMetrics,
          AlertmanagerConfig,
          RuleGroup[],
          Constraint[],
          GatekeeperConfig
        ]) => {
          this.addons = addons;
          this.nodes = nodes;
          this.machineDeployments = machineDeployments;
          this.areMachineDeploymentsInitialized = true;
          this.metrics = metrics;
          this.alertmanagerConfig = alertmanagerConfig;
          this.ruleGroups = ruleGroups;
          this.upgrades = _.isEmpty(upgrades) ? [] : upgrades;
          this.cniVersions = _.isEmpty(cniVersions)
            ? []
            : cniVersions.versions.sort((a, b) => compare(coerce(a), coerce(b)));
          this.constraints = constraints;
          this.gatekeeperConfig = gatekeeperConfig;
        },
        error: error => {
          const errorCodeNotFound = 404;
          if (error.status === errorCodeNotFound) {
            this._router.navigate(['404']);
          }
        },
      });
  }

  getProvider(provider: string): string {
    return provider === 'google' ? 'gcp' : provider;
  }

  isAddMachineDeploymentsEnabled(): boolean {
    return (
      this.isClusterRunning &&
      MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'machineDeployments', Permission.Create)
    );
  }

  addNode(): void {
    this._node
      .showMachineDeploymentCreateDialog(this.cluster, this.projectID)
      .pipe(take(1))
      .subscribe(
        _ => this._clusterService.onClusterUpdate.next(),
        _ => this._notificationService.error('Could not create the machine deployment')
      );
  }

  isDeleteEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Delete);
  }

  deleteClusterDialog(): void {
    const modal = this._matDialog.open(ClusterDeleteConfirmationComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(filter(deleted => deleted))
      .pipe(take(1))
      .subscribe(_ => this._router.navigate(['/projects/' + this.projectID + '/clusters']));
  }

  shareConfigDialog(): void {
    const modal = this._matDialog.open(ShareKubeconfigComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.seed = this.seed;
    modal.componentInstance.projectID = this.projectID;
  }

  downloadKubeconfig(): void {
    this.getDownloadURL()
      .pipe(take(1))
      .subscribe(url => window.open(url, '_blank'));
  }

  getDownloadURL(): Observable<string> {
    if (!this.isClusterAPIRunning) {
      return of('');
    }

    return this.settings.adminSettings.pipe(
      switchMap(settings =>
        iif(
          () => settings.enableOIDCKubeconfig,
          this._userService.currentUser.pipe(
            map((user: Member) =>
              this._clusterService.getShareKubeconfigURL(this.projectID, this.seed, this.cluster.id, user.id)
            )
          ),
          of(this._clusterService.getKubeconfigURL(this.projectID, this.cluster.id))
        )
      )
    );
  }

  getProxyURL(): string {
    return this._clusterService.getDashboardProxyURL(this.projectID, this.cluster.id);
  }

  getExternalCCMMigrationStatus(): string {
    if (!this.cluster || !this.cluster.status) {
      return '';
    }

    return _.startCase(this.cluster.status.externalCCMMigration);
  }

  getExternalCCMMigrationStatusMessage(): string {
    if (!this.cluster || !this.cluster.status) {
      return '';
    }

    return getExternalCCMMigrationStatusMessage(this.cluster.status.externalCCMMigration);
  }

  startExternalCCMMigration(): void {
    if (
      !this.cluster ||
      !this.cluster.status ||
      this.cluster.status.externalCCMMigration !== ExternalCCMMigrationStatus.Supported
    ) {
      return;
    }

    const dialogConfig: MatDialogConfig = {
      data: {
        title: 'External CCM Migration',
        message: `Start external CCM migration procedure of ${this.cluster.name} cluster?`,
        confirmLabel: 'Start',
      },
    };

    this._matDialog
      .open(ConfirmationDialogComponent, dialogConfig)
      .afterClosed()
      .pipe(filter(isConfirmed => isConfirmed))
      .pipe(switchMap(_ => this._clusterService.startExternalCCMMigration(this.projectID, this.cluster.id)))
      .pipe(take(1))
      .subscribe(_ =>
        this._notificationService.success(`Started external CCM migration procedure of ${this.cluster.name} cluster`)
      );
  }

  isLoaded(): boolean {
    return this.cluster && (Cluster.getProvider(this.cluster) === Provider.kubeAdm || !!this.nodeDc);
  }

  isEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  editCluster(): void {
    const modal = this._matDialog.open(EditClusterComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
  }

  editProviderSettings(): void {
    const modal = this._matDialog.open(EditProviderSettingsComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
  }

  isSSHKeysEditEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.SSHKeys, Permission.Delete);
  }

  editSSHKeys(): void {
    const modal = this._matDialog.open(EditSSHKeysComponent);
    modal.componentInstance.cluster = this.cluster;
    modal.componentInstance.projectID = this.projectID;
    modal
      .afterClosed()
      .pipe(take(1))
      .subscribe(isChanged => {
        if (isChanged) {
          this._clusterService.onClusterUpdate.next();
        }
      });
  }

  isRevokeTokenEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, View.Clusters, Permission.Edit);
  }

  revokeToken(): void {
    const dialogRef = this._matDialog.open(RevokeTokenComponent);
    dialogRef.componentInstance.cluster = this.cluster;
    dialogRef.componentInstance.projectID = this.projectID;
  }

  handleAddonCreation(addon: Addon): void {
    this._addonService
      .add(addon, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Added the ${addon.name} addon to the ${this.cluster.name} cluster`);
      });
  }

  handleAddonEdition(addon: Addon): void {
    this._addonService
      .patch(addon, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Updated the ${addon.name} addon`);
      });
  }

  handleAddonDeletion(addon: Addon): void {
    this._addonService
      .delete(addon.id, this.projectID, this.cluster.id)
      .pipe(take(1))
      .pipe(takeUntil(this._unsubscribe))
      .subscribe(() => {
        this.reloadAddons();
        this._notificationService.success(`Deleting the ${addon.name} addon from the ${this.cluster.name} cluster`);
      });
  }

  reloadAddons(): void {
    if (this.projectID && this.cluster) {
      this._addonService
        .list(this.projectID, this.cluster.id)
        .pipe(take(1))
        .subscribe(addons => (this.addons = addons));
    }
  }

  isRBACEnabled(): boolean {
    return MemberUtils.hasPermission(this._user, this._currentGroupConfig, 'rbac', Permission.View);
  }

  isMLAEnabledInSeed(): boolean {
    return this._seedSettings?.mla?.user_cluster_mla_enabled;
  }

  isMLAEnabled(): boolean {
    return (
      this.isMLAEnabledInSeed() &&
      !!this.cluster.spec.mla &&
      (!!this.cluster.spec.mla.loggingEnabled || !!this.cluster.spec.mla.monitoringEnabled)
    );
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  isShareConfigEnabled(): Observable<boolean> {
    return this.settings.adminSettings.pipe(
      map(settings => !!this.config.share_kubeconfig && !settings.enableOIDCKubeconfig)
    );
  }

  isAdmissionPluginEnabled(plugin: string): boolean {
    return this.cluster?.spec?.admissionPlugins?.includes(plugin) || false;
  }

  getAdmissionPluginName(plugin: string): string {
    return AdmissionPluginUtils.getPluginName(plugin);
  }

  isHavingCNI(): boolean {
    return !!this.cluster?.spec?.cniPlugin && this.cluster?.spec?.cniPlugin?.type !== CNIPlugin.None;
  }

  private _canReloadVersions(): boolean {
    return (
      this.cluster &&
      this.health &&
      HealthState.isUp(this.health.apiserver) &&
      HealthState.isUp(this.health.machineController)
    );
  }
}
