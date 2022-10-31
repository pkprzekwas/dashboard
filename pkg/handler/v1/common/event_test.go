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

package common_test

import (
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/handler/v1/common"

	"github.com/google/go-cmp/cmp"
	corev1 "k8s.io/api/core/v1"
)

func TestFilterEventsByType(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name           string
		Filter         string
		ExpectedEvents []apiv1.Event
		InputEvents    []apiv1.Event
	}{
		{
			Name:   "scenario 1, filter out warning event types",
			Filter: corev1.EventTypeWarning,
			ExpectedEvents: []apiv1.Event{
				genEvent("test1", corev1.EventTypeWarning),
				genEvent("test2", corev1.EventTypeWarning),
			},
			InputEvents: []apiv1.Event{
				genEvent("test1", corev1.EventTypeWarning),
				genEvent("test2", corev1.EventTypeWarning),
				genEvent("test3", corev1.EventTypeNormal),
				genEvent("test4", corev1.EventTypeNormal),
			},
		},
		{
			Name:   "scenario 2, filter out normal event types",
			Filter: corev1.EventTypeNormal,
			ExpectedEvents: []apiv1.Event{
				genEvent("test3", corev1.EventTypeNormal),
				genEvent("test4", corev1.EventTypeNormal),
			},
			InputEvents: []apiv1.Event{
				genEvent("test1", corev1.EventTypeWarning),
				genEvent("test2", corev1.EventTypeWarning),
				genEvent("test3", corev1.EventTypeNormal),
				genEvent("test4", corev1.EventTypeNormal),
			},
		},
	}
	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			result := common.FilterEventsByType(tc.InputEvents, tc.Filter)
			if !equal(result, tc.ExpectedEvents) {
				t.Fatalf("event list %v is not the same as expected %v", result, tc.ExpectedEvents)
			}
		})
	}
}

// equal tells whether a and b contain the same elements.
// A nil argument is equivalent to an empty slice.
func equal(a, b []apiv1.Event) bool {
	if len(a) != len(b) {
		return false
	}
	for i, v := range a {
		if !cmp.Equal(v, b[i]) {
			return false
		}
	}
	return true
}

func genEvent(message, eventType string) apiv1.Event {
	return apiv1.Event{
		Type:    eventType,
		Message: message,
	}
}
