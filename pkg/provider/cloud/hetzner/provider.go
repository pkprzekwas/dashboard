/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package hetzner

import (
	"context"
	"errors"
	"time"

	"k8c.io/dashboard/v2/pkg/provider"

	"github.com/hetznercloud/hcloud-go/hcloud"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources"
)

type hetzner struct {
	secretKeySelector provider.SecretKeySelectorValueFunc
}

// NewCloudProvider creates a new hetzner provider.
func NewCloudProvider(secretKeyGetter provider.SecretKeySelectorValueFunc) provider.CloudProvider {
	return &hetzner{
		secretKeySelector: secretKeyGetter,
	}
}

var _ provider.CloudProvider = &hetzner{}

// DefaultCloudSpec.
func (h *hetzner) DefaultCloudSpec(_ context.Context, _ *kubermaticv1.CloudSpec) error {
	return nil
}

// ValidateCloudSpec.
func (h *hetzner) ValidateCloudSpec(ctx context.Context, spec kubermaticv1.CloudSpec) error {
	hetznerToken, err := GetCredentialsForCluster(spec, h.secretKeySelector)
	if err != nil {
		return err
	}

	client := hcloud.NewClient(hcloud.WithToken(hetznerToken))

	timeout, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	if spec.Hetzner.Network == "" {
		// this validates the token
		_, _, err = client.ServerType.List(timeout, hcloud.ServerTypeListOpts{})
	} else {
		// this validates network and implicitly the token
		_, _, err = client.Network.GetByName(timeout, spec.Hetzner.Network)
	}

	return err
}

// InitializeCloudProvider.
func (h *hetzner) InitializeCloudProvider(_ context.Context, cluster *kubermaticv1.Cluster, _ provider.ClusterUpdater) (*kubermaticv1.Cluster, error) {
	return cluster, nil
}

// CleanUpCloudProvider.
func (h *hetzner) CleanUpCloudProvider(_ context.Context, cluster *kubermaticv1.Cluster, _ provider.ClusterUpdater) (*kubermaticv1.Cluster, error) {
	return cluster, nil
}

// ValidateCloudSpecUpdate verifies whether an update of cloud spec is valid and permitted.
func (h *hetzner) ValidateCloudSpecUpdate(_ context.Context, _ kubermaticv1.CloudSpec, _ kubermaticv1.CloudSpec) error {
	return nil
}

// GetCredentialsForCluster returns the credentials for the passed in cloud spec or an error.
func GetCredentialsForCluster(cloud kubermaticv1.CloudSpec, secretKeySelector provider.SecretKeySelectorValueFunc) (hetznerToken string, err error) {
	hetznerToken = cloud.Hetzner.Token

	if hetznerToken == "" {
		if cloud.Hetzner.CredentialsReference == nil {
			return "", errors.New("no credentials provided")
		}
		hetznerToken, err = secretKeySelector(cloud.Hetzner.CredentialsReference, resources.HetznerToken)
		if err != nil {
			return "", err
		}
	}

	return hetznerToken, nil
}

func ValidateCredentials(ctx context.Context, token string) error {
	client := hcloud.NewClient(hcloud.WithToken(token))

	timeout, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()
	opts := hcloud.LocationListOpts{}
	opts.PerPage = 1
	_, _, err := client.Location.List(timeout, opts)
	return err
}
