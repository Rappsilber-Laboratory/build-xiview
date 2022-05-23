--
-- PostgreSQL database dump
--

-- Dumped from database version 13.7 (Debian 13.7-0+deb11u1)
-- Dumped by pg_dump version 13.7 (Debian 13.7-0+deb11u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: make_uid(); Type: FUNCTION; Schema: public; Owner: xiadmin
--

CREATE FUNCTION public.make_uid() RETURNS text
    LANGUAGE plpgsql
    AS $$
BEGIN 
	return  CAST( '' || trunc(random()*10) ||  trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10)
                                || '-' || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10)
                                || '-' || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10)
                                || '-' || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10) || trunc(random()*10)
                                  AS varchar);
END;
$$;


ALTER FUNCTION public.make_uid() OWNER TO xiadmin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: dbsequence; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.dbsequence (
    id text,
    upload_id integer,
    accession text,
    name text,
    description text,
    sequence text,
    is_decoy boolean
);


ALTER TABLE public.dbsequence OWNER TO xiadmin;

--
-- Name: enzyme; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.enzyme (
    id text NOT NULL,
    upload_id bigint NOT NULL,
    protocol_id text NOT NULL,
    c_term_gain text,
    min_distance integer,
    missed_cleavages integer,
    n_term_gain text,
    name text,
    semi_specific boolean,
    site_regexp text,
    accession text
);


ALTER TABLE public.enzyme OWNER TO xiadmin;

--
-- Name: layout; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.layout (
    upload_id text NOT NULL,
    user_id integer NOT NULL,
    "time" timestamp without time zone DEFAULT now() NOT NULL,
    layout text,
    description text
);


ALTER TABLE public.layout OWNER TO xiadmin;

--
-- Name: modifiedpeptide; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.modifiedpeptide (
    id text,
    upload_id integer,
    base_sequence text,
    link_site1 integer,
    crosslinker_modmass double precision,
    crosslinker_pair_id character varying,
    mod_accessions json NOT NULL,
    mod_avg_mass_deltas json,
    mod_monoiso_mass_deltas json,
    mod_positions json,
    link_site2 integer,
    crosslinker_accession text
);


ALTER TABLE public.modifiedpeptide OWNER TO xiadmin;

--
-- Name: peptideevidence; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.peptideevidence (
    upload_id integer,
    peptide_ref text,
    dbsequence_ref text,
    protein_accession text,
    pep_start integer,
    is_decoy boolean
);


ALTER TABLE public.peptideevidence OWNER TO xiadmin;

--
-- Name: searchmodification; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.searchmodification (
    id bigint,
    upload_id integer,
    mod_name text,
    mass double precision,
    residues text,
    accession text,
    protocol_id text NOT NULL,
    specificity_rules json NOT NULL,
    fixed_mod boolean NOT NULL,
    crosslinker_id text
);


ALTER TABLE public.searchmodification OWNER TO xiadmin;

--
-- Name: spectrum; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.spectrum (
    id bigint,
    upload_id integer,
    peak_list_file_name text,
    scan_id text,
    frag_tol text,
    spectrum_ref text,
    precursor_charge smallint,
    precursor_mz double precision,
    mz double precision[],
    intensity real[]
);


ALTER TABLE public.spectrum OWNER TO xiadmin;

--
-- Name: spectrumidentification; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.spectrumidentification (
    id text,
    upload_id integer,
    spectrum_id text,
    pep1_id text,
    pep2_id text,
    charge_state integer,
    pass_threshold boolean,
    rank integer,
    scores json,
    exp_mz double precision,
    calc_mz double precision,
    meta1 character varying,
    meta2 character varying,
    meta3 character varying,
    spectra_data_ref text,
    crosslinker_identification_id integer
);


ALTER TABLE public.spectrumidentification OWNER TO xiadmin;

--
-- Name: spectrumidentificationprotocol; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.spectrumidentificationprotocol (
    upload_id bigint NOT NULL,
    frag_tol text NOT NULL,
    ions json,
    analysis_software json,
    id text NOT NULL
);


ALTER TABLE public.spectrumidentificationprotocol OWNER TO xiadmin;

--
-- Name: upload; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.upload (
    id integer NOT NULL,
    user_id integer,
    identification_file_name text,
    provider json,
    audits json,
    samples json,
    bib json,
    spectra_formats json,
    upload_time timestamp without time zone,
    contains_crosslinks boolean,
    upload_error text,
    error_type text,
    upload_warnings json,
    random_id character varying DEFAULT public.make_uid(),
    deleted boolean DEFAULT false
);


ALTER TABLE public.upload OWNER TO xiadmin;

--
-- Name: uploads_id_seq; Type: SEQUENCE; Schema: public; Owner: xiadmin
--

CREATE SEQUENCE public.uploads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.uploads_id_seq OWNER TO xiadmin;

--
-- Name: uploads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xiadmin
--

ALTER SEQUENCE public.uploads_id_seq OWNED BY public.upload.id;


--
-- Name: useraccount; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.useraccount (
    user_name character varying,
    password character varying,
    email character varying,
    gdpr_token character varying,
    id integer NOT NULL,
    ptoken character varying,
    ptoken_timestamp timestamp without time zone,
    gdpr_timestamp timestamp without time zone
);


ALTER TABLE public.useraccount OWNER TO xiadmin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: xiadmin
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO xiadmin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: xiadmin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.useraccount.id;


--
-- Name: upload id; Type: DEFAULT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.upload ALTER COLUMN id SET DEFAULT nextval('public.uploads_id_seq'::regclass);


--
-- Name: useraccount id; Type: DEFAULT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.useraccount ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: layout layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.layout
    ADD CONSTRAINT layouts_pkey PRIMARY KEY (upload_id, user_id, "time");


--
-- Name: upload uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.upload
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: peptide_evidences_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX peptide_evidences_upload_id_idx ON public.peptideevidence USING btree (upload_id);


--
-- Name: peptides_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX peptides_upload_id_idx ON public.modifiedpeptide USING btree (upload_id);


--
-- Name: spectra_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX spectra_upload_id_idx ON public.spectrum USING btree (upload_id);


--
-- Name: spectrum_identifications_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX spectrum_identifications_upload_id_idx ON public.spectrumidentification USING btree (upload_id);


--
-- PostgreSQL database dump complete
--

