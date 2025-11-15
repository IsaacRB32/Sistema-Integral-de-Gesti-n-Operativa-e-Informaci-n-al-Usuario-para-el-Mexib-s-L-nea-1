--
-- PostgreSQL database dump
--

\restrict nihmj3alGxl1QdijS3zdcBGWyPPQGFF6sibXWVsVUQxjfcEQmn1L7Nf2hS68uVl

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2025-11-14 22:16:13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 870 (class 1247 OID 16390)
-- Name: sentido_dir; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sentido_dir AS ENUM (
    'IDA',
    'REGRESO'
);


ALTER TYPE public.sentido_dir OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16435)
-- Name: catalogoincidencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.catalogoincidencias (
    id_cincidencia integer NOT NULL,
    nombre_incidencia character varying(100) NOT NULL
);


ALTER TABLE public.catalogoincidencias OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16434)
-- Name: catalogoincidencias_id_cincidencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.catalogoincidencias_id_cincidencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.catalogoincidencias_id_cincidencia_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 225
-- Name: catalogoincidencias_id_cincidencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.catalogoincidencias_id_cincidencia_seq OWNED BY public.catalogoincidencias.id_cincidencia;


--
-- TOC entry 224 (class 1259 OID 16423)
-- Name: estaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estaciones (
    id_estacion integer NOT NULL,
    nombre_estacion character varying(100) NOT NULL,
    pos_x integer NOT NULL,
    pos_y integer NOT NULL
);


ALTER TABLE public.estaciones OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16422)
-- Name: estaciones_id_estacion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estaciones_id_estacion_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estaciones_id_estacion_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 223
-- Name: estaciones_id_estacion_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estaciones_id_estacion_seq OWNED BY public.estaciones.id_estacion;


--
-- TOC entry 228 (class 1259 OID 16445)
-- Name: estadosincidencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.estadosincidencias (
    id_estado integer NOT NULL,
    estado_incidencia character varying(50) NOT NULL
);


ALTER TABLE public.estadosincidencias OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16444)
-- Name: estadosincidencias_id_estado_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.estadosincidencias_id_estado_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.estadosincidencias_id_estado_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 227
-- Name: estadosincidencias_id_estado_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.estadosincidencias_id_estado_seq OWNED BY public.estadosincidencias.id_estado;


--
-- TOC entry 237 (class 1259 OID 16562)
-- Name: eventosunidad; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.eventosunidad (
    id_evento integer NOT NULL,
    ts timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    id_unidad integer NOT NULL,
    tipo character varying(40) NOT NULL,
    detalle jsonb
);


ALTER TABLE public.eventosunidad OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16561)
-- Name: eventosunidad_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.eventosunidad_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.eventosunidad_id_evento_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 236
-- Name: eventosunidad_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.eventosunidad_id_evento_seq OWNED BY public.eventosunidad.id_evento;


--
-- TOC entry 235 (class 1259 OID 16519)
-- Name: incidencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.incidencias (
    id_incidencia integer NOT NULL,
    fecha_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_fin timestamp without time zone,
    descripcion text,
    id_estado integer,
    id_estacion integer,
    id_cincidencia integer,
    id_usuario_reporta integer,
    id_usuario_atiende integer,
    id_unidad integer
);


ALTER TABLE public.incidencias OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16518)
-- Name: incidencias_id_incidencia_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.incidencias_id_incidencia_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.incidencias_id_incidencia_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 234
-- Name: incidencias_id_incidencia_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.incidencias_id_incidencia_seq OWNED BY public.incidencias.id_incidencia;


--
-- TOC entry 220 (class 1259 OID 16396)
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id_rol integer NOT NULL,
    rol character varying(50) NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16395)
-- Name: roles_id_rol_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.roles_id_rol_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_rol_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.roles_id_rol_seq OWNED BY public.roles.id_rol;


--
-- TOC entry 231 (class 1259 OID 16466)
-- Name: rutaestaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rutaestaciones (
    id_ruta integer NOT NULL,
    id_estacion integer NOT NULL,
    orden integer NOT NULL,
    sentido public.sentido_dir NOT NULL,
    dwell_min_s integer DEFAULT 10 NOT NULL,
    dwell_max_s integer DEFAULT 25 NOT NULL
);


ALTER TABLE public.rutaestaciones OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16455)
-- Name: rutas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rutas (
    id_ruta integer NOT NULL,
    nombre character varying(100) NOT NULL,
    es_circular boolean DEFAULT true NOT NULL
);


ALTER TABLE public.rutas OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16454)
-- Name: rutas_id_ruta_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rutas_id_ruta_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rutas_id_ruta_seq OWNER TO postgres;

--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 229
-- Name: rutas_id_ruta_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rutas_id_ruta_seq OWNED BY public.rutas.id_ruta;


--
-- TOC entry 233 (class 1259 OID 16491)
-- Name: unidadesmb; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.unidadesmb (
    id_unidad integer NOT NULL,
    id_usuario integer,
    id_ruta integer,
    sentido public.sentido_dir DEFAULT 'IDA'::public.sentido_dir,
    en_circuito boolean DEFAULT false NOT NULL,
    idx_tramo integer DEFAULT 0,
    progreso numeric(6,4) DEFAULT 0,
    velocidad numeric(6,2) DEFAULT 1.50,
    estado_unidad character varying(30) DEFAULT 'FUERA_DE_SERVICIO'::character varying,
    dwell_hasta timestamp without time zone,
    CONSTRAINT unidadesmb_estado_unidad_check CHECK (((estado_unidad)::text = ANY ((ARRAY['EN_RUTA'::character varying, 'EN_ESTACION'::character varying, 'EN_COLA'::character varying, 'INCIDENCIA'::character varying, 'FUERA_DE_SERVICIO'::character varying])::text[])))
);


ALTER TABLE public.unidadesmb OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16490)
-- Name: unidadesmb_id_unidad_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.unidadesmb_id_unidad_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.unidadesmb_id_unidad_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 232
-- Name: unidadesmb_id_unidad_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.unidadesmb_id_unidad_seq OWNED BY public.unidadesmb.id_unidad;


--
-- TOC entry 222 (class 1259 OID 16406)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id_usuario integer NOT NULL,
    nombre character varying(100) NOT NULL,
    primer_apellido character varying(100) NOT NULL,
    segundo_apellido character varying(100),
    contacto character varying(50),
    email character varying(100),
    id_rol integer NOT NULL,
    password_hash character varying(255)
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16405)
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_usuario_seq OWNED BY public.usuarios.id_usuario;


--
-- TOC entry 4906 (class 2604 OID 16438)
-- Name: catalogoincidencias id_cincidencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogoincidencias ALTER COLUMN id_cincidencia SET DEFAULT nextval('public.catalogoincidencias_id_cincidencia_seq'::regclass);


--
-- TOC entry 4905 (class 2604 OID 16426)
-- Name: estaciones id_estacion; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estaciones ALTER COLUMN id_estacion SET DEFAULT nextval('public.estaciones_id_estacion_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 16448)
-- Name: estadosincidencias id_estado; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estadosincidencias ALTER COLUMN id_estado SET DEFAULT nextval('public.estadosincidencias_id_estado_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 16565)
-- Name: eventosunidad id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventosunidad ALTER COLUMN id_evento SET DEFAULT nextval('public.eventosunidad_id_evento_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 16522)
-- Name: incidencias id_incidencia; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias ALTER COLUMN id_incidencia SET DEFAULT nextval('public.incidencias_id_incidencia_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 16399)
-- Name: roles id_rol; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles ALTER COLUMN id_rol SET DEFAULT nextval('public.roles_id_rol_seq'::regclass);


--
-- TOC entry 4908 (class 2604 OID 16458)
-- Name: rutas id_ruta; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas ALTER COLUMN id_ruta SET DEFAULT nextval('public.rutas_id_ruta_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 16494)
-- Name: unidadesmb id_unidad; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidadesmb ALTER COLUMN id_unidad SET DEFAULT nextval('public.unidadesmb_id_unidad_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 16409)
-- Name: usuarios id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id_usuario SET DEFAULT nextval('public.usuarios_id_usuario_seq'::regclass);


--
-- TOC entry 5121 (class 0 OID 16435)
-- Dependencies: 226
-- Data for Name: catalogoincidencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.catalogoincidencias (id_cincidencia, nombre_incidencia) FROM stdin;
1	Falla mecánica
2	Obstrucción en vía
3	Puerta atascada
4	Emergencia médica
5	Pérdida de energía
6	Otro
\.


--
-- TOC entry 5119 (class 0 OID 16423)
-- Dependencies: 224
-- Data for Name: estaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estaciones (id_estacion, nombre_estacion, pos_x, pos_y) FROM stdin;
1	Central de Abastos	0	100
2	19 de Septiembre	6	95
3	Palomas	12	90
4	Jardines de Morelos	20	82
5	Aquiles Serdán	26	76
6	Hospital	32	70
7	1° de Mayo	30	64
8	Las Américas	27	58
9	Valle Ecatepec	24	52
10	Vocacional 3	22	46
11	Adolfo López Mateos	20	41
12	Zodiaco	18	36
13	Alfredo Torres	16	31
14	UNITEC	15	27
15	Industrial	15	23
16	Josefa Ortiz	15	19
17	Quinto Sol	15	15
18	Ciudad Azteca	15	10
\.


--
-- TOC entry 5123 (class 0 OID 16445)
-- Dependencies: 228
-- Data for Name: estadosincidencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.estadosincidencias (id_estado, estado_incidencia) FROM stdin;
1	ACTIVA
2	RESUELTA
\.


--
-- TOC entry 5132 (class 0 OID 16562)
-- Dependencies: 237
-- Data for Name: eventosunidad; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.eventosunidad (id_evento, ts, id_unidad, tipo, detalle) FROM stdin;
1	2025-11-14 20:49:21.70777	1	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
2	2025-11-14 20:51:35.496143	1	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
3	2025-11-14 20:51:41.07524	1	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
4	2025-11-14 20:51:56.605647	2	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
5	2025-11-14 20:52:47.276299	2	ENTRAR	{"id_ruta": 1, "sentido": "REGRESO", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
6	2025-11-14 20:55:18.718333	1	INCIDENCIA	{"descripcion": "Falla mecánica en motor", "id_incidencia": 1, "id_cincidencia": 1}
7	2025-11-14 20:56:28.4741	1	RESOLVER_INCIDENCIA	{"id_incidencia": 1}
8	2025-11-14 21:37:42.217343	1	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
9	2025-11-14 21:37:56.067045	1	ENTRAR	{"id_ruta": 1, "sentido": "REGRESO", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
10	2025-11-14 21:38:16.67184	2	ENTRAR	{"id_ruta": 1, "sentido": "IDA", "idx_tramo": 0, "dwell_hasta": null, "estado_inicial": "EN_RUTA"}
11	2025-11-14 21:38:38.008167	1	INCIDENCIA	{"descripcion": "Falla mecánica en motor", "id_incidencia": 2, "id_cincidencia": 1}
12	2025-11-14 21:58:38.4999	1	INCIDENCIA	{"descripcion": "Falla mecánica en motor", "id_incidencia": 3, "id_cincidencia": 1}
13	2025-11-14 22:00:44.857841	1	RESOLVER_INCIDENCIA	{"id_incidencia": 3}
14	2025-11-14 22:02:39.135435	1	RESOLVER_INCIDENCIA	{"id_incidencia": 2}
15	2025-11-14 22:03:12.76851	2	INCIDENCIA	{"descripcion": "Falla mecánica en motor", "id_incidencia": 4, "id_cincidencia": 1}
16	2025-11-14 22:03:29.03393	2	RESOLVER_INCIDENCIA	{"id_incidencia": 4}
\.


--
-- TOC entry 5130 (class 0 OID 16519)
-- Dependencies: 235
-- Data for Name: incidencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.incidencias (id_incidencia, fecha_inicio, fecha_fin, descripcion, id_estado, id_estacion, id_cincidencia, id_usuario_reporta, id_usuario_atiende, id_unidad) FROM stdin;
1	2025-11-14 20:55:18.718333	2025-11-14 20:56:28.4741	Falla mecánica en motor	2	\N	1	\N	\N	1
3	2025-11-14 21:58:38.4999	2025-11-14 22:00:44.857841	Falla mecánica en motor	2	\N	1	\N	\N	1
2	2025-11-14 21:38:38.008167	2025-11-14 22:02:39.135435	Falla mecánica en motor	2	\N	1	\N	\N	1
4	2025-11-14 22:03:12.76851	2025-11-14 22:03:29.03393	Falla mecánica en motor	2	\N	1	\N	\N	2
\.


--
-- TOC entry 5115 (class 0 OID 16396)
-- Dependencies: 220
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id_rol, rol) FROM stdin;
1	OPERADOR
2	SUPERVISOR
3	ADMINISTRADOR
\.


--
-- TOC entry 5126 (class 0 OID 16466)
-- Dependencies: 231
-- Data for Name: rutaestaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutaestaciones (id_ruta, id_estacion, orden, sentido, dwell_min_s, dwell_max_s) FROM stdin;
1	1	0	IDA	12	22
1	2	1	IDA	12	22
1	3	2	IDA	12	22
1	4	3	IDA	12	22
1	5	4	IDA	12	22
1	6	5	IDA	12	22
1	7	6	IDA	12	22
1	8	7	IDA	12	22
1	9	8	IDA	12	22
1	10	9	IDA	12	22
1	11	10	IDA	12	22
1	12	11	IDA	12	22
1	13	12	IDA	12	22
1	14	13	IDA	12	22
1	15	14	IDA	12	22
1	16	15	IDA	12	22
1	17	16	IDA	12	22
1	18	17	IDA	12	22
1	18	0	REGRESO	12	22
1	17	1	REGRESO	12	22
1	16	2	REGRESO	12	22
1	15	3	REGRESO	12	22
1	14	4	REGRESO	12	22
1	13	5	REGRESO	12	22
1	12	6	REGRESO	12	22
1	11	7	REGRESO	12	22
1	10	8	REGRESO	12	22
1	9	9	REGRESO	12	22
1	8	10	REGRESO	12	22
1	7	11	REGRESO	12	22
1	6	12	REGRESO	12	22
1	5	13	REGRESO	12	22
1	4	14	REGRESO	12	22
1	3	15	REGRESO	12	22
1	2	16	REGRESO	12	22
1	1	17	REGRESO	12	22
\.


--
-- TOC entry 5125 (class 0 OID 16455)
-- Dependencies: 230
-- Data for Name: rutas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rutas (id_ruta, nombre, es_circular) FROM stdin;
1	L1 Central de Abastos ↔ Ciudad Azteca	t
\.


--
-- TOC entry 5128 (class 0 OID 16491)
-- Dependencies: 233
-- Data for Name: unidadesmb; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.unidadesmb (id_unidad, id_usuario, id_ruta, sentido, en_circuito, idx_tramo, progreso, velocidad, estado_unidad, dwell_hasta) FROM stdin;
3	\N	1	IDA	f	0	0.0000	1.50	FUERA_DE_SERVICIO	\N
1	\N	1	IDA	t	14	0.6750	1.50	EN_RUTA	\N
2	\N	1	IDA	t	0	0.0000	1.50	EN_ESTACION	2025-11-14 22:07:17.513
\.


--
-- TOC entry 5117 (class 0 OID 16406)
-- Dependencies: 222
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id_usuario, nombre, primer_apellido, segundo_apellido, contacto, email, id_rol, password_hash) FROM stdin;
3	Mar¡a	L¢pez	Hern ndez	5559876543	supervisor1@mexibus.gob.mx	2	$2b$10$mSmvl8t.WZahZkuqZuOQZeb/MQ1vxjRgxzSgcurD/CJ72V42oJiMW
4	Juan	P‚rez	Garc¡a	5551234567	operador1@mexibus.gob.mx	1	$2b$10$mSmvl8t.WZahZkuqZuOQZeb/MQ1vxjRgxzSgcurD/CJ72V42oJiMW
5	Carlos	Ram¡rez	S nchez	5558889999	admin@mexibus.gob.mx	3	$2b$10$mSmvl8t.WZahZkuqZuOQZeb/MQ1vxjRgxzSgcurD/CJ72V42oJiMW
\.


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 225
-- Name: catalogoincidencias_id_cincidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.catalogoincidencias_id_cincidencia_seq', 12, true);


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 223
-- Name: estaciones_id_estacion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estaciones_id_estacion_seq', 36, true);


--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 227
-- Name: estadosincidencias_id_estado_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.estadosincidencias_id_estado_seq', 1, false);


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 236
-- Name: eventosunidad_id_evento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.eventosunidad_id_evento_seq', 16, true);


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 234
-- Name: incidencias_id_incidencia_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.incidencias_id_incidencia_seq', 4, true);


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 219
-- Name: roles_id_rol_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.roles_id_rol_seq', 4, true);


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 229
-- Name: rutas_id_ruta_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rutas_id_ruta_seq', 1, false);


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 232
-- Name: unidadesmb_id_unidad_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.unidadesmb_id_unidad_seq', 1, false);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 221
-- Name: usuarios_id_usuario_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_usuario_seq', 5, true);


--
-- TOC entry 4934 (class 2606 OID 16442)
-- Name: catalogoincidencias catalogoincidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.catalogoincidencias
    ADD CONSTRAINT catalogoincidencias_pkey PRIMARY KEY (id_cincidencia);


--
-- TOC entry 4931 (class 2606 OID 16432)
-- Name: estaciones estaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estaciones
    ADD CONSTRAINT estaciones_pkey PRIMARY KEY (id_estacion);


--
-- TOC entry 4937 (class 2606 OID 16452)
-- Name: estadosincidencias estadosincidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.estadosincidencias
    ADD CONSTRAINT estadosincidencias_pkey PRIMARY KEY (id_estado);


--
-- TOC entry 4953 (class 2606 OID 16574)
-- Name: eventosunidad eventosunidad_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventosunidad
    ADD CONSTRAINT eventosunidad_pkey PRIMARY KEY (id_evento);


--
-- TOC entry 4950 (class 2606 OID 16529)
-- Name: incidencias incidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_pkey PRIMARY KEY (id_incidencia);


--
-- TOC entry 4925 (class 2606 OID 16403)
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id_rol);


--
-- TOC entry 4944 (class 2606 OID 16478)
-- Name: rutaestaciones rutaestaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutaestaciones
    ADD CONSTRAINT rutaestaciones_pkey PRIMARY KEY (id_ruta, orden, sentido);


--
-- TOC entry 4940 (class 2606 OID 16464)
-- Name: rutas rutas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutas
    ADD CONSTRAINT rutas_pkey PRIMARY KEY (id_ruta);


--
-- TOC entry 4948 (class 2606 OID 16505)
-- Name: unidadesmb unidadesmb_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidadesmb
    ADD CONSTRAINT unidadesmb_pkey PRIMARY KEY (id_unidad);


--
-- TOC entry 4929 (class 2606 OID 16415)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4954 (class 1259 OID 16580)
-- Name: ix_eventos_unidad_ts; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_eventos_unidad_ts ON public.eventosunidad USING btree (id_unidad, ts DESC);


--
-- TOC entry 4951 (class 1259 OID 16560)
-- Name: ix_incidencias_unidad; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_incidencias_unidad ON public.incidencias USING btree (id_unidad);


--
-- TOC entry 4942 (class 1259 OID 16489)
-- Name: ix_rutaestaciones_ruta_sen_orden; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_rutaestaciones_ruta_sen_orden ON public.rutaestaciones USING btree (id_ruta, sentido, orden);


--
-- TOC entry 4945 (class 1259 OID 16516)
-- Name: ix_unidades_en_circuito; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_unidades_en_circuito ON public.unidadesmb USING btree (en_circuito);


--
-- TOC entry 4946 (class 1259 OID 16517)
-- Name: ix_unidades_ruta_tramo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_unidades_ruta_tramo ON public.unidadesmb USING btree (id_ruta, idx_tramo);


--
-- TOC entry 4935 (class 1259 OID 16443)
-- Name: uq_catalogo_incidencia_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_catalogo_incidencia_nombre ON public.catalogoincidencias USING btree (nombre_incidencia);


--
-- TOC entry 4932 (class 1259 OID 16433)
-- Name: uq_estaciones_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_estaciones_nombre ON public.estaciones USING btree (nombre_estacion);


--
-- TOC entry 4938 (class 1259 OID 16453)
-- Name: uq_estadosincidencias_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_estadosincidencias_nombre ON public.estadosincidencias USING btree (estado_incidencia);


--
-- TOC entry 4926 (class 1259 OID 16404)
-- Name: uq_roles_rol; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_roles_rol ON public.roles USING btree (rol);


--
-- TOC entry 4941 (class 1259 OID 16465)
-- Name: uq_rutas_nombre; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_rutas_nombre ON public.rutas USING btree (nombre);


--
-- TOC entry 4927 (class 1259 OID 16421)
-- Name: uq_usuarios_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_usuarios_email ON public.usuarios USING btree (email);


--
-- TOC entry 4966 (class 2606 OID 16575)
-- Name: eventosunidad eventosunidad_id_unidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.eventosunidad
    ADD CONSTRAINT eventosunidad_id_unidad_fkey FOREIGN KEY (id_unidad) REFERENCES public.unidadesmb(id_unidad);


--
-- TOC entry 4960 (class 2606 OID 16540)
-- Name: incidencias incidencias_id_cincidencia_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_cincidencia_fkey FOREIGN KEY (id_cincidencia) REFERENCES public.catalogoincidencias(id_cincidencia);


--
-- TOC entry 4961 (class 2606 OID 16535)
-- Name: incidencias incidencias_id_estacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_estacion_fkey FOREIGN KEY (id_estacion) REFERENCES public.estaciones(id_estacion);


--
-- TOC entry 4962 (class 2606 OID 16530)
-- Name: incidencias incidencias_id_estado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_estado_fkey FOREIGN KEY (id_estado) REFERENCES public.estadosincidencias(id_estado);


--
-- TOC entry 4963 (class 2606 OID 16555)
-- Name: incidencias incidencias_id_unidad_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_unidad_fkey FOREIGN KEY (id_unidad) REFERENCES public.unidadesmb(id_unidad);


--
-- TOC entry 4964 (class 2606 OID 16550)
-- Name: incidencias incidencias_id_usuario_atiende_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_usuario_atiende_fkey FOREIGN KEY (id_usuario_atiende) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 4965 (class 2606 OID 16545)
-- Name: incidencias incidencias_id_usuario_reporta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.incidencias
    ADD CONSTRAINT incidencias_id_usuario_reporta_fkey FOREIGN KEY (id_usuario_reporta) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 4956 (class 2606 OID 16484)
-- Name: rutaestaciones rutaestaciones_id_estacion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutaestaciones
    ADD CONSTRAINT rutaestaciones_id_estacion_fkey FOREIGN KEY (id_estacion) REFERENCES public.estaciones(id_estacion) ON DELETE CASCADE;


--
-- TOC entry 4957 (class 2606 OID 16479)
-- Name: rutaestaciones rutaestaciones_id_ruta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rutaestaciones
    ADD CONSTRAINT rutaestaciones_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.rutas(id_ruta) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 16511)
-- Name: unidadesmb unidadesmb_id_ruta_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidadesmb
    ADD CONSTRAINT unidadesmb_id_ruta_fkey FOREIGN KEY (id_ruta) REFERENCES public.rutas(id_ruta);


--
-- TOC entry 4959 (class 2606 OID 16506)
-- Name: unidadesmb unidadesmb_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.unidadesmb
    ADD CONSTRAINT unidadesmb_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.usuarios(id_usuario);


--
-- TOC entry 4955 (class 2606 OID 16416)
-- Name: usuarios usuarios_id_rol_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_id_rol_fkey FOREIGN KEY (id_rol) REFERENCES public.roles(id_rol);


-- Completed on 2025-11-14 22:16:14

--
-- PostgreSQL database dump complete
--

\unrestrict nihmj3alGxl1QdijS3zdcBGWyPPQGFF6sibXWVsVUQxjfcEQmn1L7Nf2hS68uVl

