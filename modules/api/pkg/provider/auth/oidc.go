package auth

import (
	"k8c.io/dashboard/v2/pkg/handler/auth"
	"k8c.io/dashboard/v2/pkg/provider"
	authtypes "k8c.io/dashboard/v2/pkg/provider/auth/types"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/resources/certificates"
)

func OIDCIssuerVerifierProviderFactory(
	defaultOIDCIssuerVerifier authtypes.OIDCIssuerVerifier,
	oidcIssuerRedirectURI string,
	oidcSkipTLSVerify bool,
	caBundle *certificates.CABundle,
) provider.OIDCIssuerVerifierGetter {
	return func(seed *kubermaticv1.Seed) (authtypes.OIDCIssuerVerifier, error) {
		if seed.Spec.OIDCProviderConfiguration == nil {
			return defaultOIDCIssuerVerifier, nil
		}

		oidc := seed.Spec.OIDCProviderConfiguration
		return auth.NewOpenIDClient(
			&authtypes.OIDCConfiguration{
				URL:          oidc.IssuerURL,
				ClientID:     oidc.IssuerClientID,
				ClientSecret: oidc.IssuerClientSecret,
				// TODO add it to the Seed fields and take from there
				SkipTLSVerify: oidcSkipTLSVerify,
			},
			oidcIssuerRedirectURI,
			auth.NewCombinedExtractor(
				auth.NewHeaderBearerTokenExtractor("Authorization"),
				auth.NewQueryParamBearerTokenExtractor("token"),
			),
			caBundle.CertPool(),
		)
	}
}
