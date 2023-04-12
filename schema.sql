--
-- PostgreSQL database dump
--

-- Dumped from database version 13.9 (Debian 13.9-0+deb11u1)
-- Dumped by pg_dump version 13.9 (Debian 13.9-0+deb11u1)

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
-- Name: db_sequences; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.db_sequences (
    id text,
    upload_id integer,
    accession text,
    protein_name text,
    description text,
    sequence text,
    is_decoy boolean
);


ALTER TABLE public.db_sequences OWNER TO xiadmin;

--
-- Name: layouts; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.layouts (
    search_id text NOT NULL,
    user_id integer NOT NULL,
    "time" timestamp without time zone DEFAULT now() NOT NULL,
    layout text,
    description text
);


ALTER TABLE public.layouts OWNER TO xiadmin;

--
-- Name: modifications; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.modifications (
    id bigint,
    upload_id integer,
    mod_name text,
    mass double precision,
    residues text,
    accession text
);


ALTER TABLE public.modifications OWNER TO xiadmin;

--
-- Name: peptide_evidences; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.peptide_evidences (
    upload_id integer,
    peptide_ref text,
    dbsequence_ref text,
    protein_accession text,
    pep_start integer,
    is_decoy boolean
);


ALTER TABLE public.peptide_evidences OWNER TO xiadmin;

--
-- Name: peptides; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.peptides (
    id text,
    upload_id integer,
    seq_mods text,
    link_site integer,
    crosslinker_modmass double precision,
    crosslinker_pair_id character varying
);


ALTER TABLE public.peptides OWNER TO xiadmin;

--
-- Name: spectra; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.spectra (
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


ALTER TABLE public.spectra OWNER TO xiadmin;

--
-- Name: spectrum_identifications; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.spectrum_identifications (
    id bigint,
    upload_id integer,
    spectrum_id bigint,
    pep1_id text,
    pep2_id text,
    charge_state integer,
    pass_threshold boolean,
    rank integer,
    ions text,
    scores json,
    exp_mz double precision,
    calc_mz double precision,
    meta1 character varying,
    meta2 character varying,
    meta3 character varying
);


ALTER TABLE public.spectrum_identifications OWNER TO xiadmin;

--
-- Name: upload; Type: TABLE; Schema: public; Owner: xiadmin
--

CREATE TABLE public.upload (
    id integer NOT NULL,
    user_id integer,
    identification_file_name text,
    peak_list_file_names json,
    analysis_software json,
    provider json,
    audits json,
    samples json,
    analyses json,
    protocol json,
    bib json,
    spectra_formats json,
    upload_time timestamp without time zone,
    default_pdb text,
    contains_crosslinks boolean,
    upload_error text,
    error_type text,
    upload_warnings json,
    origin text,
    random_id character varying DEFAULT public.make_uid(),
    deleted boolean DEFAULT false,
    ident_count bigint,
    ident_file_size bigint,
    zipped_peak_list_file_size character varying
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
-- Name: layouts layouts_pkey; Type: CONSTRAINT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.layouts
    ADD CONSTRAINT layouts_pkey PRIMARY KEY (search_id, user_id, "time");


--
-- Name: upload uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: xiadmin
--

ALTER TABLE ONLY public.upload
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: peptide_evidences_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX peptide_evidences_upload_id_idx ON public.peptide_evidences USING btree (upload_id);


--
-- Name: peptides_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX peptides_upload_id_idx ON public.peptides USING btree (upload_id);


--
-- Name: spectra_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX spectra_upload_id_idx ON public.spectra USING btree (upload_id);


--
-- Name: spectrum_identifications_upload_id_idx; Type: INDEX; Schema: public; Owner: xiadmin
--

CREATE INDEX spectrum_identifications_upload_id_idx ON public.spectrum_identifications USING btree (upload_id);


--
-- PostgreSQL database dump complete
--

