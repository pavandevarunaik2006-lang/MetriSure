from app.models.evidence import AuditLog

def log_action(db, user_id, user_email, user_role, action, entity_type, entity_id, details=None):
    """Log an action to the audit trail."""
    if details is not None and not isinstance(details, (dict, list)):
        details = {"message": str(details)}
    audit = AuditLog(
        user_id=user_id,
        user_email=user_email,
        user_role=user_role,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details
    )
    db.add(audit)
    db.commit()
