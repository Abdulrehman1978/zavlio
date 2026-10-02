
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "anonymous_visitors": {
                  Row: {
                    "created_at": string,"first_landing_page": string | null,"first_referrer": string | null,"first_seen_at": string,"first_source": string | null,"id": string,"last_seen_at": string,"last_source": string | null,"linked_person_id": string | null,"session_count": number,"updated_at": string,"visitor_key": string
                  }
                  Insert: {
                    "created_at"?: string,"first_landing_page"?: string | null,"first_referrer"?: string | null,"first_seen_at"?: string,"first_source"?: string | null,"id"?: string,"last_seen_at"?: string,"last_source"?: string | null,"linked_person_id"?: string | null,"session_count"?: number,"updated_at"?: string,"visitor_key"?: string
                  }
                  Update: {
                    "created_at"?: string,"first_landing_page"?: string | null,"first_referrer"?: string | null,"first_seen_at"?: string,"first_source"?: string | null,"id"?: string,"last_seen_at"?: string,"last_source"?: string | null,"linked_person_id"?: string | null,"session_count"?: number,"updated_at"?: string,"visitor_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "anonymous_visitors_linked_person_id_fkey"
      columns: ["linked_person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "anonymous_visitors_linked_person_id_fkey"
      columns: ["linked_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"actor_type": string,"after_state": Json | null,"before_state": Json | null,"created_at": string,"entity_id": string | null,"entity_type": string,"id": string,"ip_hash": string | null,"request_id": string | null
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"actor_type": string,"after_state"?: Json | null,"before_state"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type": string,"id"?: string,"ip_hash"?: string | null,"request_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"actor_type"?: string,"after_state"?: Json | null,"before_state"?: Json | null,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string,"id"?: string,"ip_hash"?: string | null,"request_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"authors": {
                  Row: {
                    "avatar_url": string | null,"bio": string | null,"created_at": string,"id": string,"name": string,"slug": string,"updated_at": string
                  }
                  Insert: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"id"?: string,"name": string,"slug": string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_url"?: string | null,"bio"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"slug"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"automation_actions": {
                  Row: {
                    "action_type": string,"attempt_number": number,"automation_job_id": string,"automation_run_id": string | null,"content_summary": string | null,"created_at": string,"dry_run": boolean,"evidence": NonNullable<Json>,"executed_at": string | null,"execution_key": string | null,"failure_reason": string | null,"id": string,"person_id": string | null,"platform": string,"requested_at": string,"status": string,"verified_at": string | null
                  }
                  Insert: {
                    "action_type": string,"attempt_number"?: number,"automation_job_id": string,"automation_run_id"?: string | null,"content_summary"?: string | null,"created_at"?: string,"dry_run"?: boolean,"evidence"?: NonNullable<Json>,"executed_at"?: string | null,"execution_key"?: string | null,"failure_reason"?: string | null,"id"?: string,"person_id"?: string | null,"platform": string,"requested_at"?: string,"status": string,"verified_at"?: string | null
                  }
                  Update: {
                    "action_type"?: string,"attempt_number"?: number,"automation_job_id"?: string,"automation_run_id"?: string | null,"content_summary"?: string | null,"created_at"?: string,"dry_run"?: boolean,"evidence"?: NonNullable<Json>,"executed_at"?: string | null,"execution_key"?: string | null,"failure_reason"?: string | null,"id"?: string,"person_id"?: string | null,"platform"?: string,"requested_at"?: string,"status"?: string,"verified_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_actions_automation_job_id_fkey"
      columns: ["automation_job_id"]
isOneToOne: false
      referencedRelation: "automation_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_actions_automation_job_id_fkey"
      columns: ["automation_job_id"]
isOneToOne: false
      referencedRelation: "crm_automation_jobs_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_actions_automation_run_id_fkey"
      columns: ["automation_run_id"]
isOneToOne: false
      referencedRelation: "automation_runs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_actions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_actions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_agents": {
                  Row: {
                    "agent_key": string,"bridge_version": string | null,"capabilities": NonNullable<Json>,"clock_skew_ms": number | null,"created_at": string,"enabled": boolean,"executor_mode": string | null,"host": string | null,"id": string,"instance_id": string | null,"last_handshake_at": string | null,"last_heartbeat_at": string | null,"name": string,"negotiated_capabilities": NonNullable<Json>,"protocol_version": number | null,"runtime_state": NonNullable<Json>,"status": string,"updated_at": string,"version": string | null
                  }
                  Insert: {
                    "agent_key": string,"bridge_version"?: string | null,"capabilities"?: NonNullable<Json>,"clock_skew_ms"?: number | null,"created_at"?: string,"enabled"?: boolean,"executor_mode"?: string | null,"host"?: string | null,"id"?: string,"instance_id"?: string | null,"last_handshake_at"?: string | null,"last_heartbeat_at"?: string | null,"name": string,"negotiated_capabilities"?: NonNullable<Json>,"protocol_version"?: number | null,"runtime_state"?: NonNullable<Json>,"status"?: string,"updated_at"?: string,"version"?: string | null
                  }
                  Update: {
                    "agent_key"?: string,"bridge_version"?: string | null,"capabilities"?: NonNullable<Json>,"clock_skew_ms"?: number | null,"created_at"?: string,"enabled"?: boolean,"executor_mode"?: string | null,"host"?: string | null,"id"?: string,"instance_id"?: string | null,"last_handshake_at"?: string | null,"last_heartbeat_at"?: string | null,"name"?: string,"negotiated_capabilities"?: NonNullable<Json>,"protocol_version"?: number | null,"runtime_state"?: NonNullable<Json>,"status"?: string,"updated_at"?: string,"version"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"automation_approvals": {
                  Row: {
                    "decided_at": string,"decided_by": string,"decision": string,"expires_at": string | null,"id": string,"job_id": string,"payload_hash": string,"policy_decision_id": string | null,"policy_version_id": string,"reason": string | null
                  }
                  Insert: {
                    "decided_at"?: string,"decided_by": string,"decision": string,"expires_at"?: string | null,"id"?: string,"job_id": string,"payload_hash": string,"policy_decision_id"?: string | null,"policy_version_id": string,"reason"?: string | null
                  }
                  Update: {
                    "decided_at"?: string,"decided_by"?: string,"decision"?: string,"expires_at"?: string | null,"id"?: string,"job_id"?: string,"payload_hash"?: string,"policy_decision_id"?: string | null,"policy_version_id"?: string,"reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_approvals_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_approvals_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "automation_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_approvals_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "crm_automation_jobs_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_approvals_policy_decision_id_fkey"
      columns: ["policy_decision_id"]
isOneToOne: false
      referencedRelation: "automation_policy_decisions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_approvals_policy_version_id_fkey"
      columns: ["policy_version_id"]
isOneToOne: false
      referencedRelation: "automation_policy_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_job_events": {
                  Row: {
                    "actor_id": string | null,"actor_type": string,"event_type": string,"from_status": string | null,"id": string,"job_id": string,"metadata": NonNullable<Json>,"occurred_at": string,"reason_code": string | null,"to_status": string | null
                  }
                  Insert: {
                    "actor_id"?: string | null,"actor_type": string,"event_type": string,"from_status"?: string | null,"id"?: string,"job_id": string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"reason_code"?: string | null,"to_status"?: string | null
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_type"?: string,"event_type"?: string,"from_status"?: string | null,"id"?: string,"job_id"?: string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"reason_code"?: string | null,"to_status"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_job_events_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "automation_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_job_events_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "crm_automation_jobs_projection"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_jobs": {
                  Row: {
                    "action_class": string,"approval_expires_at": string | null,"approved_payload_hash": string | null,"attempt_count": number,"channel": string,"claim_operation_id": string | null,"claimed_at": string | null,"claimed_by": string | null,"communication_purpose": string | null,"created_at": string,"dry_run": boolean,"failure_code": string | null,"failure_summary": string | null,"id": string,"idempotency_key": string,"last_policy_decision_id": string | null,"lease_expires_at": string | null,"machine_instance_id": string | null,"manual_action_note": string | null,"max_attempts": number,"next_eligible_at": string | null,"opportunity_id": string | null,"payload": NonNullable<Json>,"payload_hash": string | null,"person_id": string | null,"policy_version_id": string | null,"priority": number,"proposed_by": string | null,"risk_level": string,"scheduled_for": string,"source_reference": string | null,"status": string,"type": string,"updated_at": string,"version": number
                  }
                  Insert: {
                    "action_class"?: string,"approval_expires_at"?: string | null,"approved_payload_hash"?: string | null,"attempt_count"?: number,"channel": string,"claim_operation_id"?: string | null,"claimed_at"?: string | null,"claimed_by"?: string | null,"communication_purpose"?: string | null,"created_at"?: string,"dry_run"?: boolean,"failure_code"?: string | null,"failure_summary"?: string | null,"id"?: string,"idempotency_key": string,"last_policy_decision_id"?: string | null,"lease_expires_at"?: string | null,"machine_instance_id"?: string | null,"manual_action_note"?: string | null,"max_attempts"?: number,"next_eligible_at"?: string | null,"opportunity_id"?: string | null,"payload"?: NonNullable<Json>,"payload_hash"?: string | null,"person_id"?: string | null,"policy_version_id"?: string | null,"priority"?: number,"proposed_by"?: string | null,"risk_level"?: string,"scheduled_for"?: string,"source_reference"?: string | null,"status"?: string,"type": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "action_class"?: string,"approval_expires_at"?: string | null,"approved_payload_hash"?: string | null,"attempt_count"?: number,"channel"?: string,"claim_operation_id"?: string | null,"claimed_at"?: string | null,"claimed_by"?: string | null,"communication_purpose"?: string | null,"created_at"?: string,"dry_run"?: boolean,"failure_code"?: string | null,"failure_summary"?: string | null,"id"?: string,"idempotency_key"?: string,"last_policy_decision_id"?: string | null,"lease_expires_at"?: string | null,"machine_instance_id"?: string | null,"manual_action_note"?: string | null,"max_attempts"?: number,"next_eligible_at"?: string | null,"opportunity_id"?: string | null,"payload"?: NonNullable<Json>,"payload_hash"?: string | null,"person_id"?: string | null,"policy_version_id"?: string | null,"priority"?: number,"proposed_by"?: string | null,"risk_level"?: string,"scheduled_for"?: string,"source_reference"?: string | null,"status"?: string,"type"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_jobs_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "automation_agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "crm_automation_agents_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_last_policy_decision_id_fkey"
      columns: ["last_policy_decision_id"]
isOneToOne: false
      referencedRelation: "automation_policy_decisions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_policy_version_id_fkey"
      columns: ["policy_version_id"]
isOneToOne: false
      referencedRelation: "automation_policy_versions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_proposed_by_fkey"
      columns: ["proposed_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_machine_operations": {
                  Row: {
                    "agent_id": string,"created_at": string,"expires_at": string,"id": string,"job_id": string | null,"operation_id": string,"operation_type": string,"request_hash": string,"response": NonNullable<Json>
                  }
                  Insert: {
                    "agent_id": string,"created_at"?: string,"expires_at": string,"id"?: string,"job_id"?: string | null,"operation_id": string,"operation_type": string,"request_hash": string,"response": NonNullable<Json>
                  }
                  Update: {
                    "agent_id"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"job_id"?: string | null,"operation_id"?: string,"operation_type"?: string,"request_hash"?: string,"response"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_machine_operations_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "automation_agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_machine_operations_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "crm_automation_agents_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_machine_operations_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "automation_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_machine_operations_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "crm_automation_jobs_projection"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_nonces": {
                  Row: {
                    "agent_id": string,"created_at": string,"expires_at": string,"id": string,"nonce": string,"request_timestamp": string,"used_at": string
                  }
                  Insert: {
                    "agent_id": string,"created_at"?: string,"expires_at": string,"id"?: string,"nonce": string,"request_timestamp": string,"used_at"?: string
                  }
                  Update: {
                    "agent_id"?: string,"created_at"?: string,"expires_at"?: string,"id"?: string,"nonce"?: string,"request_timestamp"?: string,"used_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_nonces_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "automation_agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_nonces_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "crm_automation_agents_projection"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_policy_decisions": {
                  Row: {
                    "decision": string,"evaluated_at": string,"id": string,"job_id": string,"next_eligible_at": string | null,"person_id": string | null,"phase": string,"policy_version_id": string,"reason_codes": (string)[],"snapshot": NonNullable<Json>
                  }
                  Insert: {
                    "decision": string,"evaluated_at"?: string,"id"?: string,"job_id": string,"next_eligible_at"?: string | null,"person_id"?: string | null,"phase": string,"policy_version_id": string,"reason_codes"?: (string)[],"snapshot"?: NonNullable<Json>
                  }
                  Update: {
                    "decision"?: string,"evaluated_at"?: string,"id"?: string,"job_id"?: string,"next_eligible_at"?: string | null,"person_id"?: string | null,"phase"?: string,"policy_version_id"?: string,"reason_codes"?: (string)[],"snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_policy_decisions_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "automation_jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_policy_decisions_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "crm_automation_jobs_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_policy_decisions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_policy_decisions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_policy_decisions_policy_version_id_fkey"
      columns: ["policy_version_id"]
isOneToOne: false
      referencedRelation: "automation_policy_versions"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_policy_versions": {
                  Row: {
                    "activated_at": string | null,"active": boolean,"configuration": NonNullable<Json>,"configuration_hash": string,"created_at": string,"created_by": string | null,"id": string,"name": string,"version": number
                  }
                  Insert: {
                    "activated_at"?: string | null,"active"?: boolean,"configuration": NonNullable<Json>,"configuration_hash": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name": string,"version": number
                  }
                  Update: {
                    "activated_at"?: string | null,"active"?: boolean,"configuration"?: NonNullable<Json>,"configuration_hash"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"name"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_policy_versions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_runs": {
                  Row: {
                    "agent_id": string,"finished_at": string | null,"host": string | null,"id": string,"metadata": NonNullable<Json>,"started_at": string,"status": string,"version": string | null
                  }
                  Insert: {
                    "agent_id": string,"finished_at"?: string | null,"host"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"started_at"?: string,"status": string,"version"?: string | null
                  }
                  Update: {
                    "agent_id"?: string,"finished_at"?: string | null,"host"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"started_at"?: string,"status"?: string,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_runs_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "automation_agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_runs_agent_id_fkey"
      columns: ["agent_id"]
isOneToOne: false
      referencedRelation: "crm_automation_agents_projection"
      referencedColumns: ["id"]
    }
                  ]
                },"automation_settings": {
                  Row: {
                    "allowed_action_types": (string)[],"allowed_platforms": (string)[],"approval_mode": string,"cooldown_minutes": number,"created_at": string,"dry_run": boolean,"enabled": boolean,"id": string,"max_contacts_per_person_week": number,"max_follow_ups": number,"policy": NonNullable<Json>,"settings_key": string,"timezone": string,"updated_at": string,"working_hours": NonNullable<Json>
                  }
                  Insert: {
                    "allowed_action_types"?: (string)[],"allowed_platforms"?: (string)[],"approval_mode"?: string,"cooldown_minutes"?: number,"created_at"?: string,"dry_run"?: boolean,"enabled"?: boolean,"id"?: string,"max_contacts_per_person_week"?: number,"max_follow_ups"?: number,"policy"?: NonNullable<Json>,"settings_key"?: string,"timezone"?: string,"updated_at"?: string,"working_hours"?: NonNullable<Json>
                  }
                  Update: {
                    "allowed_action_types"?: (string)[],"allowed_platforms"?: (string)[],"approval_mode"?: string,"cooldown_minutes"?: number,"created_at"?: string,"dry_run"?: boolean,"enabled"?: boolean,"id"?: string,"max_contacts_per_person_week"?: number,"max_follow_ups"?: number,"policy"?: NonNullable<Json>,"settings_key"?: string,"timezone"?: string,"updated_at"?: string,"working_hours"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"campaign_members": {
                  Row: {
                    "added_at": string,"campaign_id": string,"person_id": string,"status": string
                  }
                  Insert: {
                    "added_at"?: string,"campaign_id": string,"person_id": string,"status"?: string
                  }
                  Update: {
                    "added_at"?: string,"campaign_id"?: string,"person_id"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "campaign_members_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaign_members_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "campaign_members_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"campaigns": {
                  Row: {
                    "audience_definition": NonNullable<Json>,"created_at": string,"ends_at": string | null,"id": string,"name": string,"starts_at": string | null,"status": string,"type": string,"updated_at": string
                  }
                  Insert: {
                    "audience_definition"?: NonNullable<Json>,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"name": string,"starts_at"?: string | null,"status"?: string,"type": string,"updated_at"?: string
                  }
                  Update: {
                    "audience_definition"?: NonNullable<Json>,"created_at"?: string,"ends_at"?: string | null,"id"?: string,"name"?: string,"starts_at"?: string | null,"status"?: string,"type"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"consents": {
                  Row: {
                    "analytics": boolean,"captured_at": string,"consent_key": string | null,"id": string,"marketing_email": boolean,"marketing_social": boolean,"metadata": NonNullable<Json>,"person_id": string | null,"personalization": boolean,"policy_version": string,"source": string,"visitor_id": string | null,"withdrawn_at": string | null
                  }
                  Insert: {
                    "analytics"?: boolean,"captured_at"?: string,"consent_key"?: string | null,"id"?: string,"marketing_email"?: boolean,"marketing_social"?: boolean,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"personalization"?: boolean,"policy_version": string,"source": string,"visitor_id"?: string | null,"withdrawn_at"?: string | null
                  }
                  Update: {
                    "analytics"?: boolean,"captured_at"?: string,"consent_key"?: string | null,"id"?: string,"marketing_email"?: boolean,"marketing_social"?: boolean,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"personalization"?: boolean,"policy_version"?: string,"source"?: string,"visitor_id"?: string | null,"withdrawn_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "consents_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "consents_visitor_id_fkey"
      columns: ["visitor_id"]
isOneToOne: false
      referencedRelation: "anonymous_visitors"
      referencedColumns: ["id"]
    }
                  ]
                },"conversations": {
                  Row: {
                    "channel": string,"created_at": string,"external_thread_id": string | null,"id": string,"last_message_at": string | null,"person_id": string | null,"social_identity_observation_id": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "channel": string,"created_at"?: string,"external_thread_id"?: string | null,"id"?: string,"last_message_at"?: string | null,"person_id"?: string | null,"social_identity_observation_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "channel"?: string,"created_at"?: string,"external_thread_id"?: string | null,"id"?: string,"last_message_at"?: string | null,"person_id"?: string | null,"social_identity_observation_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "conversations_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "conversations_social_identity_observation_id_fkey"
      columns: ["social_identity_observation_id"]
isOneToOne: false
      referencedRelation: "social_identity_observations"
      referencedColumns: ["id"]
    }
                  ]
                },"email_outbox": {
                  Row: {
                    "attempt_count": number,"created_at": string,"failure_reason": string | null,"id": string,"idempotency_key": string,"payload": NonNullable<Json>,"recipient": string,"scheduled_at": string,"sent_at": string | null,"status": string,"submission_id": string,"template": string
                  }
                  Insert: {
                    "attempt_count"?: number,"created_at"?: string,"failure_reason"?: string | null,"id"?: string,"idempotency_key": string,"payload"?: NonNullable<Json>,"recipient": string,"scheduled_at"?: string,"sent_at"?: string | null,"status"?: string,"submission_id": string,"template": string
                  }
                  Update: {
                    "attempt_count"?: number,"created_at"?: string,"failure_reason"?: string | null,"id"?: string,"idempotency_key"?: string,"payload"?: NonNullable<Json>,"recipient"?: string,"scheduled_at"?: string,"sent_at"?: string | null,"status"?: string,"submission_id"?: string,"template"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_outbox_submission_id_fkey"
      columns: ["submission_id"]
isOneToOne: false
      referencedRelation: "form_submissions"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "consent_snapshot": NonNullable<Json>,"event_name": string,"id": string,"metadata": NonNullable<Json>,"occurred_at": string,"page_path": string | null,"person_id": string | null,"request_id": string | null,"session_id": string | null,"visitor_id": string | null
                  }
                  Insert: {
                    "consent_snapshot"?: NonNullable<Json>,"event_name": string,"id"?: string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"page_path"?: string | null,"person_id"?: string | null,"request_id"?: string | null,"session_id"?: string | null,"visitor_id"?: string | null
                  }
                  Update: {
                    "consent_snapshot"?: NonNullable<Json>,"event_name"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"page_path"?: string | null,"person_id"?: string | null,"request_id"?: string | null,"session_id"?: string | null,"visitor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "sessions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_visitor_id_fkey"
      columns: ["visitor_id"]
isOneToOne: false
      referencedRelation: "anonymous_visitors"
      referencedColumns: ["id"]
    }
                  ]
                },"footer_links": {
                  Row: {
                    "created_at": string,"created_by": string | null,"group_key": string | null,"href": string,"id": string,"label": string,"sort_order": number,"updated_at": string,"updated_by": string | null,"visible": boolean
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"group_key"?: string | null,"href": string,"id"?: string,"label": string,"sort_order"?: number,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"group_key"?: string | null,"href"?: string,"id"?: string,"label"?: string,"sort_order"?: number,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "footer_links_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "footer_links_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"form_submissions": {
                  Row: {
                    "conflict_detected": boolean,"created_at": string,"form_type": string,"id": string,"idempotency_key": string,"lead_score_id": string | null,"opportunity_id": string | null,"payload": NonNullable<Json>,"person_id": string | null,"processed_at": string | null,"schema_version": string,"source": string | null,"status": string,"submitted_at": string,"task_id": string | null,"touchpoint_id": string | null,"visitor_id": string | null
                  }
                  Insert: {
                    "conflict_detected"?: boolean,"created_at"?: string,"form_type": string,"id"?: string,"idempotency_key": string,"lead_score_id"?: string | null,"opportunity_id"?: string | null,"payload"?: NonNullable<Json>,"person_id"?: string | null,"processed_at"?: string | null,"schema_version"?: string,"source"?: string | null,"status"?: string,"submitted_at"?: string,"task_id"?: string | null,"touchpoint_id"?: string | null,"visitor_id"?: string | null
                  }
                  Update: {
                    "conflict_detected"?: boolean,"created_at"?: string,"form_type"?: string,"id"?: string,"idempotency_key"?: string,"lead_score_id"?: string | null,"opportunity_id"?: string | null,"payload"?: NonNullable<Json>,"person_id"?: string | null,"processed_at"?: string | null,"schema_version"?: string,"source"?: string | null,"status"?: string,"submitted_at"?: string,"task_id"?: string | null,"touchpoint_id"?: string | null,"visitor_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "form_submissions_lead_score_id_fkey"
      columns: ["lead_score_id"]
isOneToOne: false
      referencedRelation: "crm_current_lead_score"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_lead_score_id_fkey"
      columns: ["lead_score_id"]
isOneToOne: false
      referencedRelation: "lead_scores"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["next_task_id"]
    },{
      foreignKeyName: "form_submissions_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "crm_task_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_task_id_fkey"
      columns: ["task_id"]
isOneToOne: false
      referencedRelation: "tasks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_touchpoint_id_fkey"
      columns: ["touchpoint_id"]
isOneToOne: false
      referencedRelation: "touchpoints"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "form_submissions_visitor_id_fkey"
      columns: ["visitor_id"]
isOneToOne: false
      referencedRelation: "anonymous_visitors"
      referencedColumns: ["id"]
    }
                  ]
                },"identities": {
                  Row: {
                    "confidence": number,"discovered_at": string,"email": string | null,"id": string,"last_seen_at": string | null,"metadata": NonNullable<Json>,"person_id": string,"profile_url": string | null,"provider": string,"provider_user_id": string | null,"source": string | null,"username": string | null,"verified": boolean
                  }
                  Insert: {
                    "confidence"?: number,"discovered_at"?: string,"email"?: string | null,"id"?: string,"last_seen_at"?: string | null,"metadata"?: NonNullable<Json>,"person_id": string,"profile_url"?: string | null,"provider": string,"provider_user_id"?: string | null,"source"?: string | null,"username"?: string | null,"verified"?: boolean
                  }
                  Update: {
                    "confidence"?: number,"discovered_at"?: string,"email"?: string | null,"id"?: string,"last_seen_at"?: string | null,"metadata"?: NonNullable<Json>,"person_id"?: string,"profile_url"?: string | null,"provider"?: string,"provider_user_id"?: string | null,"source"?: string | null,"username"?: string | null,"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "identities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"identity_match_candidates": {
                  Row: {
                    "confidence": number,"created_at": string,"id": string,"match_reasons": NonNullable<Json>,"person_a": string,"person_b": string,"reviewed_at": string | null,"reviewed_by": string | null,"status": string
                  }
                  Insert: {
                    "confidence": number,"created_at"?: string,"id"?: string,"match_reasons"?: NonNullable<Json>,"person_a": string,"person_b": string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Update: {
                    "confidence"?: number,"created_at"?: string,"id"?: string,"match_reasons"?: NonNullable<Json>,"person_a"?: string,"person_b"?: string,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "identity_match_candidates_person_a_fkey"
      columns: ["person_a"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identity_match_candidates_person_a_fkey"
      columns: ["person_a"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identity_match_candidates_person_b_fkey"
      columns: ["person_b"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identity_match_candidates_person_b_fkey"
      columns: ["person_b"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "identity_match_candidates_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"insights": {
                  Row: {
                    "author_id": string | null,"body": NonNullable<Json>,"canonical_url": string | null,"category": string | null,"claim_status": string | null,"created_at": string,"created_by": string | null,"demo_content": boolean,"hero_image_url": string | null,"id": string,"metadata": NonNullable<Json>,"og_image": string | null,"published_at": string | null,"read_time_minutes": number | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": string,"title": string,"updated_at": string,"updated_by": string | null,"visibility": string
                  }
                  Insert: {
                    "author_id"?: string | null,"body"?: NonNullable<Json>,"canonical_url"?: string | null,"category"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"hero_image_url"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"read_time_minutes"?: number | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: NonNullable<Json>,"canonical_url"?: string | null,"category"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"hero_image_url"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"read_time_minutes"?: number | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "insights_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "authors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "insights_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "insights_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lab_projects": {
                  Row: {
                    "body": NonNullable<Json>,"canonical_url": string | null,"claim_status": string | null,"created_at": string,"created_by": string | null,"demo_content": boolean,"id": string,"metadata": NonNullable<Json>,"og_image": string | null,"published_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": string,"summary": string | null,"title": string,"updated_at": string,"updated_by": string | null,"visibility": string
                  }
                  Insert: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: string,"summary"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: string,"summary"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lab_projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lab_projects_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_scores": {
                  Row: {
                    "calculated_at": string,"id": string,"intent_level": string,"model_version": string,"person_id": string,"reasoning": NonNullable<Json>,"score": number,"service_interest": NonNullable<Json>
                  }
                  Insert: {
                    "calculated_at"?: string,"id"?: string,"intent_level": string,"model_version": string,"person_id": string,"reasoning"?: NonNullable<Json>,"score": number,"service_interest"?: NonNullable<Json>
                  }
                  Update: {
                    "calculated_at"?: string,"id"?: string,"intent_level"?: string,"model_version"?: string,"person_id"?: string,"reasoning"?: NonNullable<Json>,"score"?: number,"service_interest"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_scores_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_scores_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_scoring_models": {
                  Row: {
                    "activated_at": string | null,"active": boolean,"configuration": NonNullable<Json>,"configuration_hash": string,"created_at": string,"created_by": string | null,"id": string,"model_key": string,"name": string,"updated_at": string,"version": number
                  }
                  Insert: {
                    "activated_at"?: string | null,"active"?: boolean,"configuration": NonNullable<Json>,"configuration_hash": string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"model_key": string,"name": string,"updated_at"?: string,"version": number
                  }
                  Update: {
                    "activated_at"?: string | null,"active"?: boolean,"configuration"?: NonNullable<Json>,"configuration_hash"?: string,"created_at"?: string,"created_by"?: string | null,"id"?: string,"model_key"?: string,"name"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_scoring_models_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "automation_action_id": string | null,"body": string,"channel": string,"conversation_id": string,"created_at": string,"direction": string,"external_message_id": string | null,"id": string,"person_id": string | null,"received_at": string | null,"sent_at": string | null,"social_identity_observation_id": string | null,"status": string
                  }
                  Insert: {
                    "automation_action_id"?: string | null,"body": string,"channel": string,"conversation_id": string,"created_at"?: string,"direction": string,"external_message_id"?: string | null,"id"?: string,"person_id"?: string | null,"received_at"?: string | null,"sent_at"?: string | null,"social_identity_observation_id"?: string | null,"status"?: string
                  }
                  Update: {
                    "automation_action_id"?: string | null,"body"?: string,"channel"?: string,"conversation_id"?: string,"created_at"?: string,"direction"?: string,"external_message_id"?: string | null,"id"?: string,"person_id"?: string | null,"received_at"?: string | null,"sent_at"?: string | null,"social_identity_observation_id"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_conversation_id_fkey"
      columns: ["conversation_id"]
isOneToOne: false
      referencedRelation: "conversations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_social_identity_observation_id_fkey"
      columns: ["social_identity_observation_id"]
isOneToOne: false
      referencedRelation: "social_identity_observations"
      referencedColumns: ["id"]
    }
                  ]
                },"navigation_items": {
                  Row: {
                    "created_at": string,"created_by": string | null,"href": string,"id": string,"label": string,"location": string,"sort_order": number,"updated_at": string,"updated_by": string | null,"visible": boolean
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"href": string,"id"?: string,"label": string,"location"?: string,"sort_order"?: number,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"href"?: string,"id"?: string,"label"?: string,"location"?: string,"sort_order"?: number,"updated_at"?: string,"updated_by"?: string | null,"visible"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "navigation_items_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "navigation_items_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "author_id": string | null,"body": string,"created_at": string,"id": string,"opportunity_id": string | null,"organization_id": string | null,"person_id": string | null,"updated_at": string,"visibility": string
                  }
                  Insert: {
                    "author_id"?: string | null,"body": string,"created_at"?: string,"id"?: string,"opportunity_id"?: string | null,"organization_id"?: string | null,"person_id"?: string | null,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "author_id"?: string | null,"body"?: string,"created_at"?: string,"id"?: string,"opportunity_id"?: string | null,"organization_id"?: string | null,"person_id"?: string | null,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunities": {
                  Row: {
                    "created_at": string,"currency": string,"estimated_value": number | null,"expected_close_date": string | null,"id": string,"lost_reason": string | null,"organization_id": string | null,"owner_id": string | null,"person_id": string,"probability": number | null,"service_interest": NonNullable<Json>,"source": string | null,"stage_id": string,"title": string,"updated_at": string,"version": number
                  }
                  Insert: {
                    "created_at"?: string,"currency"?: string,"estimated_value"?: number | null,"expected_close_date"?: string | null,"id"?: string,"lost_reason"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"person_id": string,"probability"?: number | null,"service_interest"?: NonNullable<Json>,"source"?: string | null,"stage_id": string,"title": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"currency"?: string,"estimated_value"?: number | null,"expected_close_date"?: string | null,"id"?: string,"lost_reason"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"person_id"?: string,"probability"?: number | null,"service_interest"?: NonNullable<Json>,"source"?: string | null,"stage_id"?: string,"title"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "pipeline_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"opportunity_stage_history": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"from_stage_id": string | null,"id": string,"metadata": NonNullable<Json>,"opportunity_id": string,"reason": string | null,"to_stage_id": string
                  }
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"from_stage_id"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"opportunity_id": string,"reason"?: string | null,"to_stage_id": string
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"from_stage_id"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"opportunity_id"?: string,"reason"?: string | null,"to_stage_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunity_stage_history_changed_by_fkey"
      columns: ["changed_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_stage_history_from_stage_id_fkey"
      columns: ["from_stage_id"]
isOneToOne: false
      referencedRelation: "pipeline_stages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_stage_history_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunity_stage_history_to_stage_id_fkey"
      columns: ["to_stage_id"]
isOneToOne: false
      referencedRelation: "pipeline_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"organizations": {
                  Row: {
                    "country": string | null,"created_at": string,"domain": string | null,"id": string,"industry": string | null,"name": string,"notes": string | null,"size_range": string | null,"updated_at": string,"website": string | null
                  }
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"domain"?: string | null,"id"?: string,"industry"?: string | null,"name": string,"notes"?: string | null,"size_range"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"domain"?: string | null,"id"?: string,"industry"?: string | null,"name"?: string,"notes"?: string | null,"size_range"?: string | null,"updated_at"?: string,"website"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"people": {
                  Row: {
                    "created_at": string,"display_name": string,"do_not_contact": boolean,"first_name": string | null,"first_touch_source": string | null,"id": string,"job_title": string | null,"last_activity_at": string | null,"last_name": string | null,"latest_touch_source": string | null,"lead_source": string | null,"lead_status": string | null,"lifecycle_stage": string,"merged_at": string | null,"merged_by": string | null,"merged_into_person_id": string | null,"organization_id": string | null,"owner_id": string | null,"primary_email": string | null,"primary_phone": string | null,"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"display_name": string,"do_not_contact"?: boolean,"first_name"?: string | null,"first_touch_source"?: string | null,"id"?: string,"job_title"?: string | null,"last_activity_at"?: string | null,"last_name"?: string | null,"latest_touch_source"?: string | null,"lead_source"?: string | null,"lead_status"?: string | null,"lifecycle_stage"?: string,"merged_at"?: string | null,"merged_by"?: string | null,"merged_into_person_id"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"primary_email"?: string | null,"primary_phone"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string,"do_not_contact"?: boolean,"first_name"?: string | null,"first_touch_source"?: string | null,"id"?: string,"job_title"?: string | null,"last_activity_at"?: string | null,"last_name"?: string | null,"latest_touch_source"?: string | null,"lead_source"?: string | null,"lead_status"?: string | null,"lifecycle_stage"?: string,"merged_at"?: string | null,"merged_by"?: string | null,"merged_into_person_id"?: string | null,"organization_id"?: string | null,"owner_id"?: string | null,"primary_email"?: string | null,"primary_phone"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "people_merged_by_fkey"
      columns: ["merged_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_merged_into_person_id_fkey"
      columns: ["merged_into_person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_merged_into_person_id_fkey"
      columns: ["merged_into_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"person_merges": {
                  Row: {
                    "candidate_id": string | null,"id": string,"merged_at": string,"merged_by": string,"reason": string | null,"source_person_id": string,"summary": NonNullable<Json>,"target_person_id": string
                  }
                  Insert: {
                    "candidate_id"?: string | null,"id"?: string,"merged_at"?: string,"merged_by": string,"reason"?: string | null,"source_person_id": string,"summary"?: NonNullable<Json>,"target_person_id": string
                  }
                  Update: {
                    "candidate_id"?: string | null,"id"?: string,"merged_at"?: string,"merged_by"?: string,"reason"?: string | null,"source_person_id"?: string,"summary"?: NonNullable<Json>,"target_person_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "person_merges_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "identity_match_candidates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_merges_merged_by_fkey"
      columns: ["merged_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_merges_source_person_id_fkey"
      columns: ["source_person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_merges_source_person_id_fkey"
      columns: ["source_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_merges_target_person_id_fkey"
      columns: ["target_person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "person_merges_target_person_id_fkey"
      columns: ["target_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"pipeline_stages": {
                  Row: {
                    "color_token": string | null,"created_at": string,"id": string,"is_closed": boolean,"is_won": boolean,"name": string,"slug": string,"sort_order": number,"updated_at": string
                  }
                  Insert: {
                    "color_token"?: string | null,"created_at"?: string,"id"?: string,"is_closed"?: boolean,"is_won"?: boolean,"name": string,"slug": string,"sort_order": number,"updated_at"?: string
                  }
                  Update: {
                    "color_token"?: string | null,"created_at"?: string,"id"?: string,"is_closed"?: boolean,"is_won"?: boolean,"name"?: string,"slug"?: string,"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"project_media": {
                  Row: {
                    "alt_text": string | null,"created_at": string,"id": string,"media_type": string,"metadata": NonNullable<Json>,"poster_url": string | null,"project_id": string,"sort_order": number,"url": string
                  }
                  Insert: {
                    "alt_text"?: string | null,"created_at"?: string,"id"?: string,"media_type": string,"metadata"?: NonNullable<Json>,"poster_url"?: string | null,"project_id": string,"sort_order"?: number,"url": string
                  }
                  Update: {
                    "alt_text"?: string | null,"created_at"?: string,"id"?: string,"media_type"?: string,"metadata"?: NonNullable<Json>,"poster_url"?: string | null,"project_id"?: string,"sort_order"?: number,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "project_media_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "canonical_url": string | null,"claim_status": string | null,"created_at": string,"created_by": string | null,"demo_content": boolean,"disciplines": (string)[],"gallery": NonNullable<Json>,"hero_media_url": string | null,"id": string,"metadata": NonNullable<Json>,"og_image": string | null,"project_type": string | null,"published_at": string | null,"results": NonNullable<Json>,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": string,"title": string,"updated_at": string,"updated_by": string | null,"visibility": string,"year": number | null
                  }
                  Insert: {
                    "canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"disciplines"?: (string)[],"gallery"?: NonNullable<Json>,"hero_media_url"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"project_type"?: string | null,"published_at"?: string | null,"results"?: NonNullable<Json>,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: string,"title": string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string,"year"?: number | null
                  }
                  Update: {
                    "canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"disciplines"?: (string)[],"gallery"?: NonNullable<Json>,"hero_media_url"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"project_type"?: string | null,"published_at"?: string | null,"results"?: NonNullable<Json>,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "projects_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "projects_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reusable_content_blocks": {
                  Row: {
                    "block_key": string,"block_type": string,"content": NonNullable<Json>,"created_at": string,"created_by": string | null,"id": string,"status": string,"updated_at": string,"updated_by": string | null
                  }
                  Insert: {
                    "block_key": string,"block_type": string,"content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "block_key"?: string,"block_type"?: string,"content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"id"?: string,"status"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reusable_content_blocks_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reusable_content_blocks_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"services": {
                  Row: {
                    "body": NonNullable<Json>,"canonical_url": string | null,"claim_status": string | null,"created_at": string,"created_by": string | null,"demo_content": boolean,"id": string,"metadata": NonNullable<Json>,"og_image": string | null,"published_at": string | null,"seo_description": string | null,"seo_title": string | null,"slug": string,"status": string,"summary": string | null,"title": string,"updated_at": string,"updated_by": string | null,"visibility": string
                  }
                  Insert: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug": string,"status"?: string,"summary"?: string | null,"title": string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"canonical_url"?: string | null,"claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"metadata"?: NonNullable<Json>,"og_image"?: string | null,"published_at"?: string | null,"seo_description"?: string | null,"seo_title"?: string | null,"slug"?: string,"status"?: string,"summary"?: string | null,"title"?: string,"updated_at"?: string,"updated_by"?: string | null,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "services_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "services_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"sessions": {
                  Row: {
                    "country": string | null,"created_at": string,"device_category": string | null,"ended_at": string | null,"id": string,"landing_page": string | null,"last_activity_at": string,"metadata": NonNullable<Json>,"person_id": string | null,"referrer": string | null,"started_at": string,"utm_campaign": string | null,"utm_content": string | null,"utm_medium": string | null,"utm_source": string | null,"utm_term": string | null,"visitor_id": string
                  }
                  Insert: {
                    "country"?: string | null,"created_at"?: string,"device_category"?: string | null,"ended_at"?: string | null,"id"?: string,"landing_page"?: string | null,"last_activity_at"?: string,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"referrer"?: string | null,"started_at"?: string,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null,"visitor_id": string
                  }
                  Update: {
                    "country"?: string | null,"created_at"?: string,"device_category"?: string | null,"ended_at"?: string | null,"id"?: string,"landing_page"?: string | null,"last_activity_at"?: string,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"referrer"?: string | null,"started_at"?: string,"utm_campaign"?: string | null,"utm_content"?: string | null,"utm_medium"?: string | null,"utm_source"?: string | null,"utm_term"?: string | null,"visitor_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "sessions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessions_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "sessions_visitor_id_fkey"
      columns: ["visitor_id"]
isOneToOne: false
      referencedRelation: "anonymous_visitors"
      referencedColumns: ["id"]
    }
                  ]
                },"site_settings": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"setting_key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"setting_key": string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"setting_key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"social_canary_permits": {
                  Row: {
                    "action_type": string,"consumed_at": string | null,"created_at": string,"created_by": string,"expires_at": string,"id": string,"max_uses": number,"platform": string,"revoked_at": string | null,"target_identity_key": string,"used_count": number
                  }
                  Insert: {
                    "action_type": string,"consumed_at"?: string | null,"created_at"?: string,"created_by": string,"expires_at": string,"id"?: string,"max_uses"?: number,"platform": string,"revoked_at"?: string | null,"target_identity_key": string,"used_count"?: number
                  }
                  Update: {
                    "action_type"?: string,"consumed_at"?: string | null,"created_at"?: string,"created_by"?: string,"expires_at"?: string,"id"?: string,"max_uses"?: number,"platform"?: string,"revoked_at"?: string | null,"target_identity_key"?: string,"used_count"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_canary_permits_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "social_canary_permits_platform_fkey"
      columns: ["platform"]
isOneToOne: false
      referencedRelation: "social_provider_settings"
      referencedColumns: ["platform"]
    }
                  ]
                },"social_identity_observations": {
                  Row: {
                    "confidence": number,"first_seen_at": string,"id": string,"last_seen_at": string,"metadata": NonNullable<Json>,"person_id": string | null,"platform": string,"profile_url": string | null,"provider_identity_key": string,"provider_user_id": string | null,"source": string,"username": string | null,"verification_state": string
                  }
                  Insert: {
                    "confidence"?: number,"first_seen_at"?: string,"id"?: string,"last_seen_at"?: string,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"platform": string,"profile_url"?: string | null,"provider_identity_key": string,"provider_user_id"?: string | null,"source"?: string,"username"?: string | null,"verification_state"?: string
                  }
                  Update: {
                    "confidence"?: number,"first_seen_at"?: string,"id"?: string,"last_seen_at"?: string,"metadata"?: NonNullable<Json>,"person_id"?: string | null,"platform"?: string,"profile_url"?: string | null,"provider_identity_key"?: string,"provider_user_id"?: string | null,"source"?: string,"username"?: string | null,"verification_state"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_identity_observations_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "social_identity_observations_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "social_identity_observations_platform_fkey"
      columns: ["platform"]
isOneToOne: false
      referencedRelation: "social_provider_settings"
      referencedColumns: ["platform"]
    }
                  ]
                },"social_provider_observations": {
                  Row: {
                    "auth_state": string,"conversation_provider_id": string | null,"id": string,"ingested_at": string,"normalized_messages": NonNullable<Json>,"observed_at": string,"operation_id": string,"platform": string,"provider_identity": NonNullable<Json>,"provider_identity_key": string,"provider_version": string,"request_hash": string,"schema_version": string
                  }
                  Insert: {
                    "auth_state": string,"conversation_provider_id"?: string | null,"id"?: string,"ingested_at"?: string,"normalized_messages"?: NonNullable<Json>,"observed_at": string,"operation_id": string,"platform": string,"provider_identity"?: NonNullable<Json>,"provider_identity_key": string,"provider_version": string,"request_hash"?: string,"schema_version": string
                  }
                  Update: {
                    "auth_state"?: string,"conversation_provider_id"?: string | null,"id"?: string,"ingested_at"?: string,"normalized_messages"?: NonNullable<Json>,"observed_at"?: string,"operation_id"?: string,"platform"?: string,"provider_identity"?: NonNullable<Json>,"provider_identity_key"?: string,"provider_version"?: string,"request_hash"?: string,"schema_version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_provider_observations_platform_fkey"
      columns: ["platform"]
isOneToOne: false
      referencedRelation: "social_provider_settings"
      referencedColumns: ["platform"]
    }
                  ]
                },"social_provider_settings": {
                  Row: {
                    "auth_state": string,"last_observed_at": string | null,"live_execution_enabled": boolean,"observation_enabled": boolean,"platform": string,"provider_version": string,"readiness_state": string,"updated_at": string
                  }
                  Insert: {
                    "auth_state"?: string,"last_observed_at"?: string | null,"live_execution_enabled"?: boolean,"observation_enabled"?: boolean,"platform": string,"provider_version": string,"readiness_state"?: string,"updated_at"?: string
                  }
                  Update: {
                    "auth_state"?: string,"last_observed_at"?: string | null,"live_execution_enabled"?: boolean,"observation_enabled"?: boolean,"platform"?: string,"provider_version"?: string,"readiness_state"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"social_sync_cursors": {
                  Row: {
                    "cursor_value": string | null,"last_provider_timestamp": string | null,"platform": string,"updated_at": string
                  }
                  Insert: {
                    "cursor_value"?: string | null,"last_provider_timestamp"?: string | null,"platform": string,"updated_at"?: string
                  }
                  Update: {
                    "cursor_value"?: string | null,"last_provider_timestamp"?: string | null,"platform"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "social_sync_cursors_platform_fkey"
      columns: ["platform"]
isOneToOne: true
      referencedRelation: "social_provider_settings"
      referencedColumns: ["platform"]
    }
                  ]
                },"staff_profiles": {
                  Row: {
                    "active": boolean,"auth_user_id": string | null,"avatar_url": string | null,"created_at": string,"email": string,"id": string,"name": string,"role": string,"updated_at": string
                  }
                  Insert: {
                    "active"?: boolean,"auth_user_id"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"email": string,"id"?: string,"name": string,"role"?: string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"auth_user_id"?: string | null,"avatar_url"?: string | null,"created_at"?: string,"email"?: string,"id"?: string,"name"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tasks": {
                  Row: {
                    "assigned_to": string | null,"completed_at": string | null,"created_at": string,"description": string | null,"due_at": string | null,"id": string,"opportunity_id": string | null,"person_id": string | null,"priority": string,"status": string,"title": string,"updated_at": string,"version": number
                  }
                  Insert: {
                    "assigned_to"?: string | null,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"opportunity_id"?: string | null,"person_id"?: string | null,"priority"?: string,"status"?: string,"title": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "assigned_to"?: string | null,"completed_at"?: string | null,"created_at"?: string,"description"?: string | null,"due_at"?: string | null,"id"?: string,"opportunity_id"?: string | null,"person_id"?: string | null,"priority"?: string,"status"?: string,"title"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"testimonials": {
                  Row: {
                    "claim_status": string | null,"created_at": string,"created_by": string | null,"demo_content": boolean,"id": string,"organization_name": string | null,"person_name": string | null,"person_role": string | null,"quote": string,"updated_at": string,"updated_by": string | null
                  }
                  Insert: {
                    "claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"organization_name"?: string | null,"person_name"?: string | null,"person_role"?: string | null,"quote": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "claim_status"?: string | null,"created_at"?: string,"created_by"?: string | null,"demo_content"?: boolean,"id"?: string,"organization_name"?: string | null,"person_name"?: string | null,"person_role"?: string | null,"quote"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "testimonials_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "testimonials_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"touchpoints": {
                  Row: {
                    "automation_run_id": string | null,"channel": string,"content_summary": string | null,"created_by_id": string | null,"created_by_type": string,"direction": string,"external_reference": string | null,"id": string,"metadata": NonNullable<Json>,"occurred_at": string,"opportunity_id": string | null,"person_id": string,"subject": string | null,"type": string
                  }
                  Insert: {
                    "automation_run_id"?: string | null,"channel": string,"content_summary"?: string | null,"created_by_id"?: string | null,"created_by_type": string,"direction": string,"external_reference"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"opportunity_id"?: string | null,"person_id": string,"subject"?: string | null,"type": string
                  }
                  Update: {
                    "automation_run_id"?: string | null,"channel"?: string,"content_summary"?: string | null,"created_by_id"?: string | null,"created_by_type"?: string,"direction"?: string,"external_reference"?: string | null,"id"?: string,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"opportunity_id"?: string | null,"person_id"?: string,"subject"?: string | null,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "touchpoints_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "touchpoints_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "touchpoints_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "touchpoints_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "crm_automation_agents_projection": {
                  Row: {
                    "active_claims": number | null,"agent_key": string | null,"bridge_version": string | null,"capabilities": Json | null,"clock_skew_ms": number | null,"derived_status": string | null,"enabled": boolean | null,"executor_mode": string | null,"host": string | null,"id": string | null,"instance_id": string | null,"last_handshake_at": string | null,"last_heartbeat_at": string | null,"name": string | null,"negotiated_capabilities": Json | null,"protocol_version": number | null,"runtime_state": Json | null,"version": string | null
                  }
                  Insert: {
                           "active_claims"?: never,"agent_key"?: string | null,"bridge_version"?: string | null,"capabilities"?: Json | null,"clock_skew_ms"?: number | null,"derived_status"?: never,"enabled"?: boolean | null,"executor_mode"?: string | null,"host"?: string | null,"id"?: string | null,"instance_id"?: string | null,"last_handshake_at"?: string | null,"last_heartbeat_at"?: string | null,"name"?: string | null,"negotiated_capabilities"?: Json | null,"protocol_version"?: number | null,"runtime_state"?: Json | null,"version"?: string | null
                         }
                        Update: {
                           "active_claims"?: never,"agent_key"?: string | null,"bridge_version"?: string | null,"capabilities"?: Json | null,"clock_skew_ms"?: number | null,"derived_status"?: never,"enabled"?: boolean | null,"executor_mode"?: string | null,"host"?: string | null,"id"?: string | null,"instance_id"?: string | null,"last_handshake_at"?: string | null,"last_heartbeat_at"?: string | null,"name"?: string | null,"negotiated_capabilities"?: Json | null,"protocol_version"?: number | null,"runtime_state"?: Json | null,"version"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"crm_automation_jobs_projection": {
                  Row: {
                    "action_class": string | null,"agent_name": string | null,"approval_expires_at": string | null,"attempt_count": number | null,"bridge_version": string | null,"channel": string | null,"claim_operation_id": string | null,"claimed_at": string | null,"claimed_by": string | null,"communication_purpose": string | null,"created_at": string | null,"do_not_contact": boolean | null,"dry_run": boolean | null,"execution_evidence": Json | null,"failure_code": string | null,"failure_summary": string | null,"id": string | null,"idempotency_key": string | null,"intent_level": string | null,"lead_score": number | null,"lease_expires_at": string | null,"lifecycle_stage": string | null,"machine_instance_id": string | null,"max_attempts": number | null,"opportunity_id": string | null,"opportunity_title": string | null,"organization_name": string | null,"payload": Json | null,"person_id": string | null,"person_name": string | null,"policy_decision": string | null,"policy_evaluated_at": string | null,"priority": number | null,"protocol_version": number | null,"reason_codes": (string)[] | null,"risk_level": string | null,"scheduled_for": string | null,"status": string | null,"type": string | null,"updated_at": string | null,"version": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "automation_jobs_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "automation_agents"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_claimed_by_fkey"
      columns: ["claimed_by"]
isOneToOne: false
      referencedRelation: "crm_automation_agents_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "automation_jobs_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_current_lead_score": {
                  Row: {
                    "calculated_at": string | null,"id": string | null,"intent_level": string | null,"is_stale": boolean | null,"model_version": string | null,"person_id": string | null,"reasoning": Json | null,"score": number | null,"service_interest": Json | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_scores_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lead_scores_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_people_projection": {
                  Row: {
                    "created_at": string | null,"display_name": string | null,"do_not_contact": boolean | null,"first_touch_source": string | null,"id": string | null,"job_title": string | null,"last_activity_at": string | null,"latest_intent": string | null,"latest_model_version": string | null,"latest_primary_interest": string | null,"latest_score": number | null,"latest_score_at": string | null,"latest_score_stale": boolean | null,"latest_secondary_interest": string | null,"latest_service_interest": Json | null,"latest_touch_source": string | null,"lead_source": string | null,"lead_status": string | null,"lifecycle_stage": string | null,"merged_into_person_id": string | null,"organization_domain": string | null,"organization_id": string | null,"organization_name": string | null,"owner_id": string | null,"owner_name": string | null,"primary_email": string | null,"updated_at": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "people_merged_into_person_id_fkey"
      columns: ["merged_into_person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_merged_into_person_id_fkey"
      columns: ["merged_into_person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "people_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_pipeline_projection": {
                  Row: {
                    "created_at": string | null,"currency": string | null,"do_not_contact": boolean | null,"estimated_value": number | null,"expected_close_date": string | null,"id": string | null,"intent_level": string | null,"is_closed": boolean | null,"is_won": boolean | null,"last_activity_at": string | null,"lead_score": number | null,"lost_reason": string | null,"next_task_due_at": string | null,"next_task_id": string | null,"next_task_overdue": boolean | null,"next_task_title": string | null,"organization_id": string | null,"organization_name": string | null,"owner_id": string | null,"owner_name": string | null,"person_id": string | null,"person_name": string | null,"primary_email": string | null,"primary_interest": string | null,"probability": number | null,"service_interest": Json | null,"source": string | null,"stage_id": string | null,"stage_name": string | null,"stage_slug": string | null,"stage_sort_order": number | null,"title": string | null,"updated_at": string | null,"version": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "opportunities_organization_id_fkey"
      columns: ["organization_id"]
isOneToOne: false
      referencedRelation: "organizations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "opportunities_stage_id_fkey"
      columns: ["stage_id"]
isOneToOne: false
      referencedRelation: "pipeline_stages"
      referencedColumns: ["id"]
    }
                  ]
                },"crm_task_projection": {
                  Row: {
                    "assigned_to": string | null,"assignee_name": string | null,"completed_at": string | null,"created_at": string | null,"description": string | null,"due_at": string | null,"id": string | null,"is_overdue": boolean | null,"opportunity_id": string | null,"opportunity_title": string | null,"person_id": string | null,"person_name": string | null,"priority": string | null,"status": string | null,"title": string | null,"updated_at": string | null,"version": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "tasks_assigned_to_fkey"
      columns: ["assigned_to"]
isOneToOne: false
      referencedRelation: "staff_profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "crm_pipeline_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_opportunity_id_fkey"
      columns: ["opportunity_id"]
isOneToOne: false
      referencedRelation: "opportunities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "crm_people_projection"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tasks_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "activate_automation_policy":
{ Args: { "p_configuration": Json,"p_name": string }; Returns: {
              "activated_at": string | null,
"active": boolean,
"configuration": NonNullable<Json>,
"configuration_hash": string,
"created_at": string,
"created_by": string | null,
"id": string,
"name": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_policy_versions"
        isOneToOne: false
        isSetofReturn: true
      } },
"approve_automation_job":
{ Args: { "p_expected_version": number,"p_job_id": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"assert_crm_analytics_range":
{ Args: { "p_end": string,"p_start": string }; Returns: undefined
                           },
"automation_check_job":
{ Args: { "p_as_of"?: string,"p_job_id": string,"p_phase": string }; Returns: string
                           },
"automation_payload_hash":
{ Args: { "p": Json }; Returns: string
                           },
"cancel_automation_job":
{ Args: { "p_expected_version": number,"p_job_id": string,"p_reason": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"claim_next_automation_job":
{ Args: { "p_agent_id": string,"p_lease_seconds"?: number }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"cleanup_automation_protocol_history":
{ Args: { "p_limit"?: number }; Returns: Json
                           },
"complete_automation_job":
{ Args: { "p_agent_id": string,"p_evidence"?: Json,"p_job_id": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"consume_automation_nonce":
{ Args: { "p_agent_key": string,"p_expires_at": string,"p_nonce": string,"p_request_timestamp": string }; Returns: string
                           },
"consume_social_canary_permit":
{ Args: { "p_action_type": string,"p_permit_id": string,"p_platform": string,"p_target_identity_key": string }; Returns: boolean
                           },
"create_crm_task":
{ Args: { "p_assigned_to": string,"p_description": string,"p_due_at": string,"p_opportunity_id": string,"p_person_id": string,"p_priority": string,"p_title": string }; Returns: {
              "assigned_to": string | null,
"completed_at": string | null,
"created_at": string,
"description": string | null,
"due_at": string | null,
"id": string,
"opportunity_id": string | null,
"person_id": string | null,
"priority": string,
"status": string,
"title": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "tasks"
        isOneToOne: false
        isSetofReturn: true
      } },
"crm_analytics_acquisition":
{ Args: { "p_end": string,"p_start": string }; Returns: Json
                           },
"crm_analytics_leads":
{ Args: { "p_end": string,"p_start": string }; Returns: Json
                           },
"crm_analytics_operations":
{ Args: { "p_end": string,"p_start": string }; Returns: Json
                           },
"crm_analytics_overview":
{ Args: { "p_end": string,"p_previous_end": string,"p_previous_start": string,"p_start": string }; Returns: Json
                           },
"crm_analytics_pipeline":
{ Args: { "p_end": string,"p_start": string }; Returns: Json
                           },
"crm_lifecycle_rank":
{ Args: { "p_stage": string }; Returns: number
                           },
"crm_person_timeline":
{ Args: { "p_before_at"?: string,"p_before_id"?: string,"p_category"?: string,"p_limit"?: number,"p_person_id": string }; Returns: {
              "actor": string,"category": string,"item_id": string,"item_type": string,"occurred_at": string,"source_entity": string,"source_id": string,"summary": string,"title": string,"visibility": string
            }[]
                           },
"current_staff_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"current_staff_role":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"database_health":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"ensure_analytics_session":
{ Args: { "p_country": string,"p_device_category": string,"p_landing_page": string,"p_now": string,"p_referrer": string,"p_timeout": string,"p_utm_campaign": string,"p_utm_content": string,"p_utm_medium": string,"p_utm_source": string,"p_utm_term": string,"p_visitor_key": string }; Returns: {
              "created_session": boolean,"created_visitor": boolean,"session_id": string,"visitor_id": string
            }[]
                           },
"fail_automation_job":
{ Args: { "p_agent_id": string,"p_code": string,"p_job_id": string,"p_retry_at"?: string,"p_summary": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"get_active_lead_scoring_model":
{ Args: Record<PropertyKey, never>; Returns: {
              "activated_at": string,"configuration": Json,"configuration_hash": string,"id": string,"model_key": string,"name": string,"version": number
            }[]
                           },
"has_staff_role":
{ Args: { "required_role": string }; Returns: boolean
                           },
"intake_lead_submission":
{ Args: { "p_budget_key": string,"p_company": string,"p_company_domain": string,"p_create_opportunity": boolean,"p_due_at": string,"p_email": string,"p_email_jobs": Json,"p_form_type": string,"p_idempotency_key": string,"p_link_analytics": boolean,"p_name": string,"p_opportunity_title": string,"p_payload": Json,"p_role": string,"p_schema_version": string,"p_score": number,"p_score_intent": string,"p_score_reasoning": Json,"p_self_reported_source": string,"p_service_interests": Json,"p_system_source": string,"p_task_priority": string,"p_task_title": string,"p_timing_key": string,"p_touchpoint_summary": string,"p_touchpoint_type": string,"p_visitor_key": string,"p_website": string }; Returns: {
              "conflict_detected": boolean,"duplicate": boolean,"lead_score_id": string,"opportunity_id": string,"person_id": string,"submission_id": string,"task_id": string,"touchpoint_id": string,"visitor_id": string
            }[]
                           },
"is_active_staff":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"machine_claim_automation_job":
{ Args: { "p_agent_id": string,"p_instance_id": string,"p_operation_id": string,"p_request_hash": string }; Returns: Json
                           },
"machine_extend_automation_lease":
{ Args: { "p_agent_id": string,"p_expected_lease": string,"p_expected_version": number,"p_instance_id": string,"p_job_id": string,"p_operation_id": string,"p_request_hash": string }; Returns: Json
                           },
"machine_result_automation_job":
{ Args: { "p_agent_id": string,"p_evidence": Json,"p_expected_version": number,"p_failure_code": string,"p_failure_summary": string,"p_instance_id": string,"p_job_id": string,"p_operation_id": string,"p_request_hash": string,"p_result_type": string,"p_retry_after": string }; Returns: Json
                           },
"machine_start_automation_job":
{ Args: { "p_agent_id": string,"p_content_hash": string,"p_expected_lease": string,"p_expected_version": number,"p_instance_id": string,"p_job_id": string,"p_operation_id": string,"p_policy_version": number,"p_request_hash": string }; Returns: Json
                           },
"merge_people":
{ Args: { "p_candidate_id"?: string,"p_reason"?: string,"p_source_person_id": string,"p_target_person_id": string }; Returns: {
              "candidate_status": string,"canonical_person_id": string,"merged_person_id": string,"relation_counts": Json
            }[]
                           },
"persist_lead_score":
{ Args: { "p_calculated_at": string,"p_intent_level": string,"p_model_version": string,"p_person_id": string,"p_reasoning": Json,"p_score": number,"p_service_interest": Json }; Returns: string
                           },
"propose_automation_job":
{ Args: { "p_action": string,"p_channel": string,"p_idempotency_key": string,"p_opportunity_id": string,"p_payload": Json,"p_person_id": string,"p_priority"?: number,"p_purpose": string,"p_scheduled_for"?: string,"p_source_reference"?: string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"record_automation_heartbeat":
{ Args: { "p_agent_id": string,"p_capabilities": Json,"p_runtime_state"?: Json,"p_version": string }; Returns: undefined
                           },
"record_crm_audit":
{ Args: { "p_action": string,"p_after_state"?: Json,"p_before_state"?: Json,"p_entity_id": string,"p_entity_type": string }; Returns: string
                           },
"record_machine_handshake":
{ Args: { "p_agent_id": string,"p_bridge_version": string,"p_capabilities": Json,"p_clock_skew_ms": number,"p_instance_id": string }; Returns: undefined
                           },
"record_machine_heartbeat":
{ Args: { "p_agent_id": string,"p_bridge_version": string,"p_instance_id": string,"p_runtime_state": Json }; Returns: undefined
                           },
"record_social_observation":
{ Args: { "p_auth_state": string,"p_conversation_provider_id": string,"p_normalized_messages": Json,"p_observed_at": string,"p_operation_id": string,"p_platform": string,"p_provider_identity": Json,"p_provider_identity_key": string,"p_provider_version": string,"p_request_hash": string }; Returns: string
                           },
"recover_expired_automation_jobs":
{ Args: { "p_as_of"?: string }; Returns: number
                           },
"reject_automation_job":
{ Args: { "p_expected_version": number,"p_job_id": string,"p_reason": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"resolve_automation_manual_action":
{ Args: { "p_expected_version": number,"p_job_id": string,"p_note": string,"p_resolution": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"resolve_canonical_person_id":
{ Args: { "p_person_id": string }; Returns: string
                           },
"review_social_identity_observation":
{ Args: { "p_observation_id": string,"p_person_id": string }; Returns: string
                           },
"set_automation_agent_enabled":
{ Args: { "p_agent_id": string,"p_enabled": boolean }; Returns: {
              "agent_key": string,
"bridge_version": string | null,
"capabilities": NonNullable<Json>,
"clock_skew_ms": number | null,
"created_at": string,
"enabled": boolean,
"executor_mode": string | null,
"host": string | null,
"id": string,
"instance_id": string | null,
"last_handshake_at": string | null,
"last_heartbeat_at": string | null,
"name": string,
"negotiated_capabilities": NonNullable<Json>,
"protocol_version": number | null,
"runtime_state": NonNullable<Json>,
"status": string,
"updated_at": string,
"version": string | null
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_agents"
        isOneToOne: false
        isSetofReturn: true
      } },
"start_automation_job":
{ Args: { "p_agent_id": string,"p_job_id": string }; Returns: {
              "action_class": string,
"approval_expires_at": string | null,
"approved_payload_hash": string | null,
"attempt_count": number,
"channel": string,
"claim_operation_id": string | null,
"claimed_at": string | null,
"claimed_by": string | null,
"communication_purpose": string | null,
"created_at": string,
"dry_run": boolean,
"failure_code": string | null,
"failure_summary": string | null,
"id": string,
"idempotency_key": string,
"last_policy_decision_id": string | null,
"lease_expires_at": string | null,
"machine_instance_id": string | null,
"manual_action_note": string | null,
"max_attempts": number,
"next_eligible_at": string | null,
"opportunity_id": string | null,
"payload": NonNullable<Json>,
"payload_hash": string | null,
"person_id": string | null,
"policy_version_id": string | null,
"priority": number,
"proposed_by": string | null,
"risk_level": string,
"scheduled_for": string,
"source_reference": string | null,
"status": string,
"type": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "automation_jobs"
        isOneToOne: false
        isSetofReturn: true
      } },
"transition_opportunity_stage":
{ Args: { "p_expected_updated_at": string,"p_lost_reason"?: string,"p_opportunity_id": string,"p_reason"?: string,"p_target_stage_id": string }; Returns: {
              "created_at": string,
"currency": string,
"estimated_value": number | null,
"expected_close_date": string | null,
"id": string,
"lost_reason": string | null,
"organization_id": string | null,
"owner_id": string | null,
"person_id": string,
"probability": number | null,
"service_interest": NonNullable<Json>,
"source": string | null,
"stage_id": string,
"title": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "opportunities"
        isOneToOne: false
        isSetofReturn: true
      } },
"update_crm_task":
{ Args: { "p_assigned_to": string,"p_description": string,"p_due_at": string,"p_expected_updated_at": string,"p_id": string,"p_priority": string,"p_status": string,"p_title": string }; Returns: {
              "assigned_to": string | null,
"completed_at": string | null,
"created_at": string,
"description": string | null,
"due_at": string | null,
"id": string,
"opportunity_id": string | null,
"person_id": string | null,
"priority": string,
"status": string,
"title": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "tasks"
        isOneToOne: false
        isSetofReturn: true
      } },
"update_opportunity":
{ Args: { "p_currency": string,"p_estimated_value": number,"p_expected_close_date": string,"p_expected_updated_at": string,"p_id": string,"p_owner_id": string,"p_probability": number,"p_service_interest": Json,"p_title": string }; Returns: {
              "created_at": string,
"currency": string,
"estimated_value": number | null,
"expected_close_date": string | null,
"id": string,
"lost_reason": string | null,
"organization_id": string | null,
"owner_id": string | null,
"person_id": string,
"probability": number | null,
"service_interest": NonNullable<Json>,
"source": string | null,
"stage_id": string,
"title": string,
"updated_at": string,
"version": number
            }[]
                          SetofOptions: {
        from: "*"
        to: "opportunities"
        isOneToOne: false
        isSetofReturn: true
      } }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"storage": {
          Tables: {
            "buckets": {
                  Row: {
                    "allowed_mime_types": (string)[] | null,"avif_autodetection": boolean | null,"created_at": string | null,"file_size_limit": number | null,"id": string,"lifecycle_configuration": Json | null,"lifecycle_configuration_generation": string | null,"name": string,"owner": string | null,"owner_id": string | null,"public": boolean | null,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string | null,"versioning_status": string
                  }
                  Insert: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id": string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name": string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Update: {
                    "allowed_mime_types"?: (string)[] | null,"avif_autodetection"?: boolean | null,"created_at"?: string | null,"file_size_limit"?: number | null,"id"?: string,"lifecycle_configuration"?: Json | null,"lifecycle_configuration_generation"?: string | null,"name"?: string,"owner"?: string | null,"owner_id"?: string | null,"public"?: boolean | null,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string | null,"versioning_status"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_analytics": {
                  Row: {
                    "created_at": string,"deleted_at": string | null,"format": string,"id": string,"name": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"deleted_at"?: string | null,"format"?: string,"id"?: string,"name"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"buckets_vectors": {
                  Row: {
                    "created_at": string,"id": string,"type": Database["storage"]['Enums']["buckettype"],"updated_at": string
                  }
                  Insert: {
                    "created_at"?: string,"id": string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"type"?: Database["storage"]['Enums']["buckettype"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"iceberg_namespaces": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"metadata": NonNullable<Json>,"name": string,"updated_at": string
                  }
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"metadata"?: NonNullable<Json>,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    }
                  ]
                },"iceberg_tables": {
                  Row: {
                    "bucket_name": string,"catalog_id": string,"created_at": string,"id": string,"location": string,"name": string,"namespace_id": string,"remote_table_id": string | null,"shard_id": string | null,"shard_key": string | null,"updated_at": string
                  }
                  Insert: {
                    "bucket_name": string,"catalog_id": string,"created_at"?: string,"id"?: string,"location": string,"name": string,"namespace_id": string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "bucket_name"?: string,"catalog_id"?: string,"created_at"?: string,"id"?: string,"location"?: string,"name"?: string,"namespace_id"?: string,"remote_table_id"?: string | null,"shard_id"?: string | null,"shard_key"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "iceberg_tables_catalog_id_fkey"
      columns: ["catalog_id"]
isOneToOne: false
      referencedRelation: "buckets_analytics"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "iceberg_tables_namespace_id_fkey"
      columns: ["namespace_id"]
isOneToOne: false
      referencedRelation: "iceberg_namespaces"
      referencedColumns: ["id"]
    }
                  ]
                },"migrations": {
                  Row: {
                    "executed_at": string | null,"hash": string,"id": number,"name": string
                  }
                  Insert: {
                    "executed_at"?: string | null,"hash": string,"id": number,"name": string
                  }
                  Update: {
                    "executed_at"?: string | null,"hash"?: string,"id"?: number,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"objects": {
                  Row: {
                    "archived_at": string | null,"bucket_id": string | null,"created_at": string | null,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string | null,"metadata": Json | null,"name": string | null,"owner": string | null,"owner_id": string | null,"path_tokens": (string)[] | null,"updated_at": string | null,"user_metadata": Json | null,"version": string | null
                  }
                  Insert: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"bucket_id"?: string | null,"created_at"?: string | null,"id"?: string,"is_delete_marker"?: boolean,"is_versioned"?: boolean,"last_accessed_at"?: string | null,"metadata"?: Json | null,"name"?: string | null,"owner"?: string | null,"owner_id"?: string | null,"path_tokens"?: never,"updated_at"?: string | null,"user_metadata"?: Json | null,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "objects_bucketId_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads": {
                  Row: {
                    "bucket_id": string,"created_at": string,"id": string,"in_progress_size": number,"key": string,"metadata": Json | null,"owner_id": string | null,"upload_signature": string,"user_metadata": Json | null,"version": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"id": string,"in_progress_size"?: number,"key": string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature": string,"user_metadata"?: Json | null,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"id"?: string,"in_progress_size"?: number,"key"?: string,"metadata"?: Json | null,"owner_id"?: string | null,"upload_signature"?: string,"user_metadata"?: Json | null,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    }
                  ]
                },"s3_multipart_uploads_parts": {
                  Row: {
                    "bucket_id": string,"created_at": string,"etag": string,"id": string,"key": string,"owner_id": string | null,"part_number": number,"size": number,"upload_id": string,"version": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"etag": string,"id"?: string,"key": string,"owner_id"?: string | null,"part_number": number,"size"?: number,"upload_id": string,"version": string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"etag"?: string,"id"?: string,"key"?: string,"owner_id"?: string | null,"part_number"?: number,"size"?: number,"upload_id"?: string,"version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
      columns: ["upload_id"]
isOneToOne: false
      referencedRelation: "s3_multipart_uploads"
      referencedColumns: ["id"]
    }
                  ]
                },"vector_indexes": {
                  Row: {
                    "bucket_id": string,"created_at": string,"data_type": string,"dimension": number,"distance_metric": string,"id": string,"metadata_configuration": Json | null,"name": string,"updated_at": string
                  }
                  Insert: {
                    "bucket_id": string,"created_at"?: string,"data_type": string,"dimension": number,"distance_metric": string,"id"?: string,"metadata_configuration"?: Json | null,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "bucket_id"?: string,"created_at"?: string,"data_type"?: string,"dimension"?: number,"distance_metric"?: string,"id"?: string,"metadata_configuration"?: Json | null,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vector_indexes_bucket_id_fkey"
      columns: ["bucket_id"]
isOneToOne: false
      referencedRelation: "buckets_vectors"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "allow_any_operation":
{ Args: { "expected_operations": (string)[] }; Returns: boolean
                           },
"allow_only_operation":
{ Args: { "expected_operation": string }; Returns: boolean
                           },
"can_insert_object":
{ Args: { "bucketid": string,"metadata": Json,"name": string,"owner": string }; Returns: undefined
                           },
"extension":
{ Args: { "name": string }; Returns: string
                           },
"filename":
{ Args: { "name": string }; Returns: string
                           },
"foldername":
{ Args: { "name": string }; Returns: (string)[]
                           },
"get_common_prefix":
{ Args: { "p_delimiter": string,"p_key": string,"p_prefix": string }; Returns: string
                           },
"get_size_by_bucket":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string }; Returns: {
              "bucket_id": string,"size": number
            }[]
                           },
"list_multipart_uploads_with_delimiter":
{ Args: { "bucket_id": string,"delimiter_param": string,"max_keys"?: number,"next_key_token"?: string,"next_upload_token"?: string,"prefix_param": string,"raw_prefix_param"?: string }; Returns: {
              "created_at": string,"id": string,"key": string
            }[]
                           },
"list_objects_with_delimiter":
{ Args: { "_bucket_id": string,"delete_markers"?: string,"delimiter_param": string,"max_keys"?: number,"next_token"?: string,"next_token_archived_at"?: string,"next_token_version"?: string,"noncurrent_versions"?: string,"prefix_param": string,"sort_order"?: string,"start_after"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"operation":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"search":
{ Args: { "bucketname": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"offsets"?: number,"prefix": string,"search"?: string,"sortcolumn"?: string,"sortorder"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_by_timestamp":
{ Args: { "delete_markers"?: string,"noncurrent_versions"?: string,"p_bucket_id": string,"p_level": number,"p_limit": number,"p_prefix": string,"p_sort_column": string,"p_sort_column_after": string,"p_sort_order": string,"p_start_after": string,"p_start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           },
"search_v2":
{ Args: { "bucket_name": string,"delete_markers"?: string,"levels"?: number,"limits"?: number,"noncurrent_versions"?: string,"prefix": string,"sort_column"?: string,"sort_column_after"?: string,"sort_order"?: string,"start_after"?: string,"start_after_archived_at"?: string,"start_after_is_continuation"?: boolean,"start_after_version"?: string }; Returns: {
              "archived_at": string,"created_at": string,"id": string,"is_delete_marker": boolean,"is_versioned": boolean,"key": string,"last_accessed_at": string,"metadata": Json,"name": string,"updated_at": string,"version": string
            }[]
                           }
          }
          Enums: {
            "buckettype": "STANDARD"|"ANALYTICS"|"VECTOR"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        },"storage": {
          Enums: {
            "buckettype": ["STANDARD", "ANALYTICS", "VECTOR"]
          }
        }
} as const

