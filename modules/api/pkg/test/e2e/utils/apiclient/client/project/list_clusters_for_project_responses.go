// Code generated by go-swagger; DO NOT EDIT.

package project

// This file was generated by the swagger tool.
// Editing this file might prove futile when you re-run the swagger generate command

import (
	"fmt"
	"io"

	"github.com/go-openapi/runtime"
	"github.com/go-openapi/strfmt"

	"k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/models"
)

// ListClustersForProjectReader is a Reader for the ListClustersForProject structure.
type ListClustersForProjectReader struct {
	formats strfmt.Registry
}

// ReadResponse reads a server response into the received o.
func (o *ListClustersForProjectReader) ReadResponse(response runtime.ClientResponse, consumer runtime.Consumer) (interface{}, error) {
	switch response.Code() {
	case 200:
		result := NewListClustersForProjectOK()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return result, nil
	case 401:
		result := NewListClustersForProjectUnauthorized()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	case 403:
		result := NewListClustersForProjectForbidden()
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		return nil, result
	default:
		result := NewListClustersForProjectDefault(response.Code())
		if err := result.readResponse(response, consumer, o.formats); err != nil {
			return nil, err
		}
		if response.Code()/100 == 2 {
			return result, nil
		}
		return nil, result
	}
}

// NewListClustersForProjectOK creates a ListClustersForProjectOK with default headers values
func NewListClustersForProjectOK() *ListClustersForProjectOK {
	return &ListClustersForProjectOK{}
}

/*
ListClustersForProjectOK describes a response with status code 200, with default header values.

ClusterList
*/
type ListClustersForProjectOK struct {
	Payload models.ClusterList
}

// IsSuccess returns true when this list clusters for project o k response has a 2xx status code
func (o *ListClustersForProjectOK) IsSuccess() bool {
	return true
}

// IsRedirect returns true when this list clusters for project o k response has a 3xx status code
func (o *ListClustersForProjectOK) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list clusters for project o k response has a 4xx status code
func (o *ListClustersForProjectOK) IsClientError() bool {
	return false
}

// IsServerError returns true when this list clusters for project o k response has a 5xx status code
func (o *ListClustersForProjectOK) IsServerError() bool {
	return false
}

// IsCode returns true when this list clusters for project o k response a status code equal to that given
func (o *ListClustersForProjectOK) IsCode(code int) bool {
	return code == 200
}

func (o *ListClustersForProjectOK) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectOK  %+v", 200, o.Payload)
}

func (o *ListClustersForProjectOK) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectOK  %+v", 200, o.Payload)
}

func (o *ListClustersForProjectOK) GetPayload() models.ClusterList {
	return o.Payload
}

func (o *ListClustersForProjectOK) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	// response payload
	if err := consumer.Consume(response.Body(), &o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}

// NewListClustersForProjectUnauthorized creates a ListClustersForProjectUnauthorized with default headers values
func NewListClustersForProjectUnauthorized() *ListClustersForProjectUnauthorized {
	return &ListClustersForProjectUnauthorized{}
}

/*
ListClustersForProjectUnauthorized describes a response with status code 401, with default header values.

EmptyResponse is a empty response
*/
type ListClustersForProjectUnauthorized struct {
}

// IsSuccess returns true when this list clusters for project unauthorized response has a 2xx status code
func (o *ListClustersForProjectUnauthorized) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list clusters for project unauthorized response has a 3xx status code
func (o *ListClustersForProjectUnauthorized) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list clusters for project unauthorized response has a 4xx status code
func (o *ListClustersForProjectUnauthorized) IsClientError() bool {
	return true
}

// IsServerError returns true when this list clusters for project unauthorized response has a 5xx status code
func (o *ListClustersForProjectUnauthorized) IsServerError() bool {
	return false
}

// IsCode returns true when this list clusters for project unauthorized response a status code equal to that given
func (o *ListClustersForProjectUnauthorized) IsCode(code int) bool {
	return code == 401
}

func (o *ListClustersForProjectUnauthorized) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectUnauthorized ", 401)
}

func (o *ListClustersForProjectUnauthorized) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectUnauthorized ", 401)
}

func (o *ListClustersForProjectUnauthorized) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListClustersForProjectForbidden creates a ListClustersForProjectForbidden with default headers values
func NewListClustersForProjectForbidden() *ListClustersForProjectForbidden {
	return &ListClustersForProjectForbidden{}
}

/*
ListClustersForProjectForbidden describes a response with status code 403, with default header values.

EmptyResponse is a empty response
*/
type ListClustersForProjectForbidden struct {
}

// IsSuccess returns true when this list clusters for project forbidden response has a 2xx status code
func (o *ListClustersForProjectForbidden) IsSuccess() bool {
	return false
}

// IsRedirect returns true when this list clusters for project forbidden response has a 3xx status code
func (o *ListClustersForProjectForbidden) IsRedirect() bool {
	return false
}

// IsClientError returns true when this list clusters for project forbidden response has a 4xx status code
func (o *ListClustersForProjectForbidden) IsClientError() bool {
	return true
}

// IsServerError returns true when this list clusters for project forbidden response has a 5xx status code
func (o *ListClustersForProjectForbidden) IsServerError() bool {
	return false
}

// IsCode returns true when this list clusters for project forbidden response a status code equal to that given
func (o *ListClustersForProjectForbidden) IsCode(code int) bool {
	return code == 403
}

func (o *ListClustersForProjectForbidden) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectForbidden ", 403)
}

func (o *ListClustersForProjectForbidden) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProjectForbidden ", 403)
}

func (o *ListClustersForProjectForbidden) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	return nil
}

// NewListClustersForProjectDefault creates a ListClustersForProjectDefault with default headers values
func NewListClustersForProjectDefault(code int) *ListClustersForProjectDefault {
	return &ListClustersForProjectDefault{
		_statusCode: code,
	}
}

/*
ListClustersForProjectDefault describes a response with status code -1, with default header values.

errorResponse
*/
type ListClustersForProjectDefault struct {
	_statusCode int

	Payload *models.ErrorResponse
}

// Code gets the status code for the list clusters for project default response
func (o *ListClustersForProjectDefault) Code() int {
	return o._statusCode
}

// IsSuccess returns true when this list clusters for project default response has a 2xx status code
func (o *ListClustersForProjectDefault) IsSuccess() bool {
	return o._statusCode/100 == 2
}

// IsRedirect returns true when this list clusters for project default response has a 3xx status code
func (o *ListClustersForProjectDefault) IsRedirect() bool {
	return o._statusCode/100 == 3
}

// IsClientError returns true when this list clusters for project default response has a 4xx status code
func (o *ListClustersForProjectDefault) IsClientError() bool {
	return o._statusCode/100 == 4
}

// IsServerError returns true when this list clusters for project default response has a 5xx status code
func (o *ListClustersForProjectDefault) IsServerError() bool {
	return o._statusCode/100 == 5
}

// IsCode returns true when this list clusters for project default response a status code equal to that given
func (o *ListClustersForProjectDefault) IsCode(code int) bool {
	return o._statusCode == code
}

func (o *ListClustersForProjectDefault) Error() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProject default  %+v", o._statusCode, o.Payload)
}

func (o *ListClustersForProjectDefault) String() string {
	return fmt.Sprintf("[GET /api/v1/projects/{project_id}/clusters][%d] listClustersForProject default  %+v", o._statusCode, o.Payload)
}

func (o *ListClustersForProjectDefault) GetPayload() *models.ErrorResponse {
	return o.Payload
}

func (o *ListClustersForProjectDefault) readResponse(response runtime.ClientResponse, consumer runtime.Consumer, formats strfmt.Registry) error {

	o.Payload = new(models.ErrorResponse)

	// response payload
	if err := consumer.Consume(response.Body(), o.Payload); err != nil && err != io.EOF {
		return err
	}

	return nil
}
