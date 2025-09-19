package graph

import (
	"context"

	"filevault/internal/models"

	"github.com/99designs/gqlgen/graphql"
)

// NewExecutableSchema creates a new executable GraphQL schema
func NewExecutableSchema(cfg Config) graphql.ExecutableSchema {
	return &executableSchema{cfg}
}

type executableSchema struct {
	cfg Config
}

func (e *executableSchema) Schema() *graphql.Schema {
	return &graphql.Schema{
		Query: &graphql.Object{
			Name: "Query",
			Fields: graphql.Fields{
				"me": &graphql.Field{
					Type:        &graphql.Object{Name: "User"},
					Resolve:     e.Query().Me,
					Description: "Get current user",
				},
				"files": &graphql.Field{
					Type:        &graphql.List{OfType: &graphql.NonNull{OfType: &graphql.Object{Name: "File"}}},
					Resolve:     e.Query().Files,
					Description: "Get user files",
				},
				"file": &graphql.Field{
					Type:        &graphql.Object{Name: "File"},
					Resolve:     e.Query().File,
					Description: "Get file by ID",
				},
				"searchFiles": &graphql.Field{
					Type:        &graphql.List{OfType: &graphql.NonNull{OfType: &graphql.Object{Name: "File"}}},
					Resolve:     e.Query().SearchFiles,
					Description: "Search files",
				},
				"fileStats": &graphql.Field{
					Type:        &graphql.Object{Name: "FileStats"},
					Resolve:     e.Query().FileStats,
					Description: "Get file statistics",
				},
			},
		},
		Mutation: &graphql.Object{
			Name: "Mutation",
			Fields: graphql.Fields{
				"registerUser": &graphql.Field{
					Type:        &graphql.Object{Name: "AuthPayload"},
					Resolve:     e.Mutation().RegisterUser,
					Description: "Register new user",
				},
				"loginUser": &graphql.Field{
					Type:        &graphql.Object{Name: "AuthPayload"},
					Resolve:     e.Mutation().LoginUser,
					Description: "Login user",
				},
				"uploadFile": &graphql.Field{
					Type:        &graphql.Object{Name: "File"},
					Resolve:     e.Mutation().UploadFile,
					Description: "Upload file",
				},
				"deleteFile": &graphql.Field{
					Type:        &graphql.Boolean,
					Resolve:     e.Mutation().DeleteFile,
					Description: "Delete file",
				},
			},
		},
	}
}

func (e *executableSchema) Query() QueryResolver {
	return e.cfg.Resolvers.Query()
}

func (e *executableSchema) Mutation() MutationResolver {
	return e.cfg.Resolvers.Mutation()
}

// Simple field resolvers for basic types
func (r *Resolver) Me(ctx context.Context) (*models.User, error) {
	return r.getCurrentUser(ctx)
}

func (r *Resolver) Files(ctx context.Context, limit *int, offset *int) ([]*models.File, error) {
	return r.Files(ctx, limit, offset)
}

func (r *Resolver) File(ctx context.Context, id string) (*models.File, error) {
	return r.File(ctx, id)
}

func (r *Resolver) SearchFiles(ctx context.Context, searchTerm string, limit *int, offset *int) ([]*models.File, error) {
	return r.SearchFiles(ctx, searchTerm, limit, offset)
}

func (r *Resolver) FileStats(ctx context.Context) (*models.FileStats, error) {
	return r.FileStats(ctx)
}

func (r *Resolver) RegisterUser(ctx context.Context, email string, username string, password string) (*models.AuthPayload, error) {
	return r.RegisterUser(ctx, email, username, password)
}

func (r *Resolver) LoginUser(ctx context.Context, email string, password string) (*models.AuthPayload, error) {
	return r.LoginUser(ctx, email, password)
}

func (r *Resolver) UploadFile(ctx context.Context, file graphql.Upload) (*models.File, error) {
	return r.UploadFile(ctx, file.File, file.FileHeader)
}

func (r *Resolver) DeleteFile(ctx context.Context, id string) (bool, error) {
	return r.DeleteFile(ctx, id)
}



