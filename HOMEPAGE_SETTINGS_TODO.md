# Homepage Settings Feature - Implementation Checklist

- [ ] Create migration for `homepage_settings` table (with correct convention)
- [ ] Define model/types for homepage settings (in modelTypes.ts)
- [ ] Implement query/service layer for homepage settings (CRUD, soft delete, order by section_position, exclude deleted by default)
- [ ] Add Joi validation schemas for homepage settings requests
- [ ] Implement routes/controllers for homepage settings (CRUD, GET ordered, exclude deleted, auth same as collections)
- [ ] Handle section_images as array of URL paths (follow products/collections mechanism)
- [ ] Integrate authentication/authorization (same as collections)
- [ ] Add tests for all endpoints and edge cases
- [ ] Update documentation if needed
