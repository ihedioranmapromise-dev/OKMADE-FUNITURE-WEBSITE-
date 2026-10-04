export async function PUT(request) {
  if (!(await isAdmin(request))) return unauthorized();
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return badRequest("id required");

    const allowed = [
      "status",
      "timeline",
      "client_name",
      "client_contact",
      "client_address",
      "work_description",
      "city",
      "duration_weeks",
      "project_details",
      "category_id",
      "price",
    ];
    const updates = {};
    allowed.forEach((k) => {
      if (body[k] !== undefined) updates[k] = body[k];
    });
    if (Object.keys(updates).length === 0) return badRequest("Nothing to update");

    const { error } = await admin.from("projects").update(updates).eq("id", id);
    if (error) return serverError(error.message);

    await logActivity({
      action: "project_updated",
      target_type: "project",
      target_id: id,
      details: { fields: Object.keys(updates) },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return serverError(err.message);
  }
}
