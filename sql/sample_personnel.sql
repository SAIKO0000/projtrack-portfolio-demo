-- Insert sample personnel data for testing
INSERT INTO personnel (name, email, position, department, phone, prc_license, years_experience)
VALUES 
  ('John Doe', 'john.doe@gygpower.com', 'Senior Electrical Engineer', 'Engineering', '+63 917 123 4567', 'EE-12345', 8),
  ('Maria Santos', 'maria.santos@gygpower.com', 'Project Manager', 'Project Management', '+63 917 234 5678', 'PM-67890', 12),
  ('Carlos Rivera', 'carlos.rivera@gygpower.com', 'Electrical Technician', 'Field Operations', '+63 917 345 6789', 'ET-11111', 5),
  ('Ana Garcia', 'ana.garcia@gygpower.com', 'Quality Assurance Engineer', 'Quality Control', '+63 917 456 7890', 'QA-22222', 6),
  ('Robert Chen', 'robert.chen@gygpower.com', 'Senior Project Engineer', 'Engineering', '+63 917 567 8901', 'EE-33333', 10),
  ('Elena Rodriguez', 'elena.rodriguez@gygpower.com', 'Site Supervisor', 'Field Operations', '+63 917 678 9012', 'SS-44444', 7),
  ('Michael Santos', 'michael.santos@gygpower.com', 'Safety Officer', 'Safety', '+63 917 789 0123', 'SO-55555', 9),
  ('Lisa Wang', 'lisa.wang@gygpower.com', 'Design Engineer', 'Engineering', '+63 917 890 1234', 'DE-66666', 4),
  ('David Cruz', 'david.cruz@gygpower.com', 'Project Coordinator', 'Project Management', '+63 917 901 2345', 'PC-77777', 3),
  ('Sarah Kim', 'sarah.kim@gygpower.com', 'Field Engineer', 'Field Operations', '+63 917 012 3456', 'FE-88888', 6)
ON CONFLICT (email) DO NOTHING;
