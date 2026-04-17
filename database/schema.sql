CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS farmer (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    county VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farm (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmer(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    county VARCHAR(80) NOT NULL,
    total_area_ha NUMERIC(10,2) NOT NULL CHECK (total_area_ha >= 0),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS field (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    land_use_type VARCHAR(50) NOT NULL,
    area_ha NUMERIC(10,2) NOT NULL CHECK (area_ha >= 0),
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_field_boundary_gist ON field USING GIST (boundary);

CREATE TABLE IF NOT EXISTS crop (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES field(id) ON DELETE CASCADE,
    crop_type VARCHAR(80) NOT NULL,
    season VARCHAR(40) NOT NULL,
    planted_on DATE,
    harvested_on DATE
);

CREATE TABLE IF NOT EXISTS soil_health (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES field(id) ON DELETE CASCADE,
    sample_date DATE NOT NULL,
    ph NUMERIC(4,2) NOT NULL,
    nitrogen NUMERIC(8,2) NOT NULL,
    phosphorus NUMERIC(8,2) NOT NULL,
    potassium NUMERIC(8,2) NOT NULL,
    organic_matter NUMERIC(5,2),
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS satellite_monitoring (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES field(id) ON DELETE CASCADE,
    capture_date DATE NOT NULL,
    ndvi NUMERIC(5,3) NOT NULL,
    soil_moisture NUMERIC(5,2),
    condition VARCHAR(50),
    source VARCHAR(80) DEFAULT 'Sentinel sample'
);

CREATE TABLE IF NOT EXISTS livestock (
    id BIGSERIAL PRIMARY KEY,
    farm_id BIGINT NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    species VARCHAR(50) NOT NULL,
    head_count INTEGER NOT NULL CHECK (head_count >= 0),
    livestock_units NUMERIC(10,2) NOT NULL CHECK (livestock_units >= 0)
);

CREATE TABLE IF NOT EXISTS government_program (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    eligibility TEXT,
    application_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS government_program_application (
    id BIGSERIAL PRIMARY KEY,
    farmer_id BIGINT NOT NULL REFERENCES farmer(id) ON DELETE CASCADE,
    government_program_id BIGINT NOT NULL REFERENCES government_program(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    applied_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS yield_prediction (
    id BIGSERIAL PRIMARY KEY,
    field_id BIGINT NOT NULL REFERENCES field(id) ON DELETE CASCADE,
    crop_type VARCHAR(80) NOT NULL,
    season VARCHAR(40) NOT NULL,
    predicted_tons NUMERIC(10,2) NOT NULL,
    confidence_score NUMERIC(4,3) NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO government_program (name, description, eligibility, application_url)
VALUES
('ACRES', 'Agri-Climate Rural Environment Scheme support.', 'Eligible Irish farmers', 'https://www.gov.ie'),
('Organic Farming Scheme', 'Support for conversion and maintenance of organic systems.', 'Farmers entering/maintaining organic production', 'https://www.gov.ie')
ON CONFLICT DO NOTHING;
