--
-- PostgreSQL database dump
--

\restrict KpabpC2hV1jvHomvenzFhLFc7My4DsKoOoBuINmh1MvewXJ0vxRFYv2hNNFcwKg

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 17.9 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: annotation_snapshots; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.annotation_snapshots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annotation_id uuid NOT NULL,
    version bigint,
    coordinates jsonb NOT NULL,
    damage_type character varying(30),
    severity bigint,
    created_at timestamp with time zone
);


ALTER TABLE public.annotation_snapshots OWNER TO beiqi;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    target_type text NOT NULL,
    target_id text NOT NULL,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone
);


ALTER TABLE public.audit_logs OWNER TO beiqi;

--
-- Name: damage_annotations; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.damage_annotations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mural_id uuid NOT NULL,
    image_layer character varying(20) DEFAULT 'visible'::character varying,
    damage_type character varying(30) NOT NULL,
    severity bigint NOT NULL,
    coordinates jsonb NOT NULL,
    area numeric,
    area_percent numeric,
    description text,
    version bigint DEFAULT 1,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.damage_annotations OWNER TO beiqi;

--
-- Name: knowledge_docs; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.knowledge_docs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    category character varying(30) NOT NULL,
    file_path text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.knowledge_docs OWNER TO beiqi;

--
-- Name: material_records; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.material_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    quantity numeric,
    unit text,
    cost numeric,
    created_at timestamp with time zone
);


ALTER TABLE public.material_records OWNER TO beiqi;

--
-- Name: mural_histories; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.mural_histories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mural_id uuid NOT NULL,
    field text NOT NULL,
    old_value text,
    new_value text,
    changed_by text NOT NULL,
    changed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.mural_histories OWNER TO beiqi;

--
-- Name: mural_images; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.mural_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mural_id uuid NOT NULL,
    file_path text NOT NULL,
    file_hash text NOT NULL,
    image_type character varying(20) DEFAULT 'visible'::character varying,
    version bigint DEFAULT 1,
    width bigint,
    height bigint,
    file_size bigint,
    thumbnail_path text,
    webp_path text,
    created_at timestamp with time zone
);


ALTER TABLE public.mural_images OWNER TO beiqi;

--
-- Name: murals; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.murals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    era text NOT NULL,
    site text NOT NULL,
    material text NOT NULL,
    tomb_location text,
    excavation_date timestamp with time zone,
    dimensions text,
    description text,
    status character varying(20) DEFAULT 'registered'::character varying,
    health_index numeric,
    is_featured boolean DEFAULT false,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.murals OWNER TO beiqi;

--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    used boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO beiqi;

--
-- Name: plan_reviews; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.plan_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    result character varying(10) NOT NULL,
    comment text,
    created_at timestamp with time zone
);


ALTER TABLE public.plan_reviews OWNER TO beiqi;

--
-- Name: plan_status_changes; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.plan_status_changes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    from_status character varying(20),
    to_status character varying(20),
    changed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.plan_status_changes OWNER TO beiqi;

--
-- Name: project_murals; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.project_murals (
    project_id uuid DEFAULT gen_random_uuid() NOT NULL,
    mural_id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.project_murals OWNER TO beiqi;

--
-- Name: project_phases; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.project_phases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_id uuid NOT NULL,
    name text NOT NULL,
    "order" bigint,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.project_phases OWNER TO beiqi;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    progress numeric DEFAULT 0,
    budget numeric,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.projects OWNER TO beiqi;

--
-- Name: rest_tasks; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.rest_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phase_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.rest_tasks OWNER TO beiqi;

--
-- Name: restoration_plans; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.restoration_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    annotation_id uuid NOT NULL,
    method text NOT NULL,
    materials text NOT NULL,
    expected_result text,
    status character varying(20) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    before_image text,
    after_image text,
    after_version bigint DEFAULT 0
);


ALTER TABLE public.restoration_plans OWNER TO beiqi;

--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.task_assignments (
    rest_task_id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE public.task_assignments OWNER TO beiqi;

--
-- Name: task_attachments; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.task_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size bigint,
    created_at timestamp with time zone
);


ALTER TABLE public.task_attachments OWNER TO beiqi;

--
-- Name: users; Type: TABLE; Schema: public; Owner: beiqi
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role character varying(20) DEFAULT 'researcher'::character varying,
    avatar text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.users OWNER TO beiqi;

--
-- Data for Name: annotation_snapshots; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.annotation_snapshots (id, annotation_id, version, coordinates, damage_type, severity, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.audit_logs (id, user_id, action, target_type, target_id, details, ip_address, created_at) FROM stdin;
b0000000-0000-0000-0000-000000000001	0f80575a-c147-4d92-af79-c057515f3fc8	create	mural	10000000-0000-0000-0000-000000000001	{"note": "创建壁画档案"}	10.0.0.11	2026-03-24 10:06:23.96033+08
b0000000-0000-0000-0000-000000000002	09235d9c-09ee-4990-93e7-6ea43eeaa5b0	update	project	20000000-0000-0000-0000-000000000001	{"note": "更新项目进度"}	10.0.0.12	2026-03-25 10:06:23.96033+08
b0000000-0000-0000-0000-000000000003	02352c6e-3165-4938-bbaa-33065949e578	review	plan	70000000-0000-0000-0000-000000000001	{"result": "approved"}	10.0.0.21	2026-03-26 10:06:23.96033+08
b0000000-0000-0000-0000-000000000004	51d524e0-e066-4be9-ba34-9c394583b41b	export	admin	dataset	{"scope": "murals,projects"}	10.0.0.1	2026-03-27 10:06:23.96033+08
4659aca0-2585-4f71-864e-66bdacc2447c	51d524e0-e066-4be9-ba34-9c394583b41b	PUT	/api/admin/users/:id/role	148cb98c-be59-46af-86bf-e39ef61c6f53	{"path": "/api/admin/users/148cb98c-be59-46af-86bf-e39ef61c6f53/role"}	::1	2026-03-31 13:38:04.2262+08
6ec90f67-9c51-4acd-b9e6-2654e05492fe	51d524e0-e066-4be9-ba34-9c394583b41b	PUT	/api/admin/users/:id/role	148cb98c-be59-46af-86bf-e39ef61c6f53	{"path": "/api/admin/users/148cb98c-be59-46af-86bf-e39ef61c6f53/role"}	::1	2026-03-31 13:38:08.235005+08
4e9dc9e2-5c9d-4dec-af4f-de8c9362cacf	51d524e0-e066-4be9-ba34-9c394583b41b	PUT	/api/plans/:id	70000000-0000-0000-0000-000000000001	{"path": "/api/plans/70000000-0000-0000-0000-000000000001"}	::1	2026-03-31 13:46:26.70659+08
783db960-390f-49ed-b682-ac2476ff154a	51d524e0-e066-4be9-ba34-9c394583b41b	PUT	/api/plans/:id	70000000-0000-0000-0000-000000000001	{"path": "/api/plans/70000000-0000-0000-0000-000000000001"}	::1	2026-03-31 13:46:31.107596+08
8305a0fa-9ca4-44aa-94e2-c8bfc65f53b7	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:10:56.525366+08
a60342af-f8ff-4332-bfb9-4741b72c54fe	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:17:30.353882+08
8847cdd8-c913-4a0b-b654-c495cd70afdb	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:18:01.271971+08
a33f0079-8f3d-4c4e-a182-c3a065355dce	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:19:52.689599+08
23e191f2-fbb7-41dd-b508-aa6a7cbea1d2	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:20:11.647592+08
8647bd18-1ba7-4033-b775-ca5dfdf61569	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:20:15.685611+08
b6ff154c-f8ff-4011-b40e-4496e9fb5245	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:23:18.169758+08
8429c60e-2831-44ad-9f8d-28aa9a5d853b	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:29:55.814677+08
7ab9786d-addc-4f5d-9348-0336cee198ee	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:30:20.753423+08
8b63eda7-22c3-467c-8812-5aced417d445	51d524e0-e066-4be9-ba34-9c394583b41b	POST	/api/knowledge/qa		{"path": "/api/knowledge/qa"}	::1	2026-03-31 14:32:27.119261+08
\.


--
-- Data for Name: damage_annotations; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.damage_annotations (id, mural_id, image_layer, damage_type, severity, coordinates, area, area_percent, description, version, created_at, updated_at) FROM stdin;
60000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000001	visible	flaking	3	{"type": "polygon", "points": [{"x": 120.5, "y": 80.2}, {"x": 210.1, "y": 92.7}, {"x": 198.4, "y": 168.9}, {"x": 115.3, "y": 154.6}]}	0.43	3.1	东壁中部颜料层起甲，边缘存在轻微空鼓。	1	2026-03-13 10:06:23.96033+08	2026-03-19 10:06:23.96033+08
\.


--
-- Data for Name: knowledge_docs; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.knowledge_docs (id, title, content, category, file_path, created_at, updated_at) FROM stdin;
a0000000-0000-0000-0000-000000000001	北齐壁画加固流程（现场版）	# 北齐壁画加固流程\n\n1. 病害分级与网格建档\n2. 小样测试与参数确认\n3. 分区注射与表层整固\n4. 复测与回访记录	standard_process	\N	2026-03-11 10:06:23.96033+08	2026-03-28 10:06:23.96033+08
a0000000-0000-0000-0000-000000000002	修复材料兼容性清单	# 修复材料兼容性\n\n- 改性环氧树脂\n- 丙烯酸乳液\n- 无机矿物颜料\n\n> 使用前需做附着力与色差测试	material_manual	\N	2026-03-15 10:06:23.96033+08	2026-03-27 10:06:23.96033+08
a0000000-0000-0000-0000-000000000003	娄睿墓壁画保护案例复盘	# 案例复盘\n\n本案例记录了污染层去除、起甲边缘整固和复测流程。	case_study	\N	2026-03-19 10:06:23.96033+08	2026-03-29 10:06:23.96033+08
a0000000-0000-0000-0000-000000000004	文物保护工程数据留痕要求	# 数据留痕要求\n\n- 关键操作可追溯\n- 图像与日志双归档\n- 审批意见可审计	regulation	\N	2026-03-22 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
\.


--
-- Data for Name: material_records; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.material_records (id, project_id, name, quantity, unit, cost, created_at) FROM stdin;
50000000-0000-0000-0000-000000000001	20000000-0000-0000-0000-000000000001	改性环氧树脂	12.5	kg	4200	2026-03-21 10:06:23.96033+08
50000000-0000-0000-0000-000000000002	20000000-0000-0000-0000-000000000001	无纺布	30	m2	1800	2026-03-22 10:06:23.96033+08
\.


--
-- Data for Name: mural_histories; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.mural_histories (id, mural_id, field, old_value, new_value, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: mural_images; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.mural_images (id, mural_id, file_path, file_hash, image_type, version, width, height, file_size, thumbnail_path, webp_path, created_at) FROM stdin;
\.


--
-- Data for Name: murals; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.murals (id, name, era, site, material, tomb_location, excavation_date, dimensions, description, status, health_index, is_featured, created_at, updated_at) FROM stdin;
10000000-0000-0000-0000-000000000001	九原岗北朝壁画（东壁）	北齐	忻州九原岗	灰泥彩绘	东壁主墓室	\N	420cm x 260cm	东壁局部存在起甲与空鼓现象，已进入重点监测。	restoring	42	t	2026-02-19 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
10000000-0000-0000-0000-000000000002	娄睿墓鞍马游骑图	北齐	太原娄睿墓	泥地矿物颜料	甬道北壁	\N	360cm x 210cm	颜料层老化褪色，存在局部污染。	assessing	58	f	2026-02-26 10:06:23.96033+08	2026-03-29 10:06:23.96033+08
10000000-0000-0000-0000-000000000003	湾漳大墓仪仗出行图	北齐	磁县湾漳大墓	灰泥彩绘	前室西壁	\N	380cm x 230cm	整体结构稳定，处于常态化监测阶段。	monitoring	76	f	2026-03-02 10:06:23.96033+08	2026-03-28 10:06:23.96033+08
10000000-0000-0000-0000-000000000004	徐显秀墓宴饮图	北齐	太原王家峰	矿物颜料	后室南壁	\N	300cm x 180cm	一期修复已完成，准备整理归档。	completed	88	f	2026-03-06 10:06:23.96033+08	2026-03-27 10:06:23.96033+08
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.password_reset_tokens (id, user_id, token, used, expires_at, created_at) FROM stdin;
c864fb95-eb07-4430-92f4-45da0fd01274	c9a29714-c21e-4303-92ae-d2ab3dfe435c	212f8287ab2f6f6aabef48476f132e367428301018d946aeaed5bb539eff80e5	t	2026-03-30 16:00:54.781647+08	2026-03-30 15:00:54.781781+08
be4230bc-8b62-4fa1-b46d-67636097fcb0	c9a29714-c21e-4303-92ae-d2ab3dfe435c	9586a805815ca5047beedf2246f898236b0a610c1e6a4c5be88e46045d4956de	f	2026-03-30 16:00:54.967945+08	2026-03-30 15:00:54.968376+08
8f20a92a-0dae-405d-93a3-727dca408039	401eecd6-a8d9-4fe8-adb0-e40cfc89fc0f	08253560e0aa2b0009ed731b5431061b318f783a8a169203e3e0bace25b417f3	t	2026-03-30 16:28:52.869813+08	2026-03-30 15:28:52.869907+08
1f909599-b743-4786-8037-0a906ad6eaa0	401eecd6-a8d9-4fe8-adb0-e40cfc89fc0f	24f28646be3c782cd2ef883c863bab22b66bf784a566a231c88e88907ff77a42	t	2026-03-30 16:28:53.06735+08	2026-03-30 15:28:53.067452+08
\.


--
-- Data for Name: plan_reviews; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.plan_reviews (id, plan_id, reviewer_id, result, comment, created_at) FROM stdin;
80000000-0000-0000-0000-000000000001	70000000-0000-0000-0000-000000000001	02352c6e-3165-4938-bbaa-33065949e578	approved	方法可行，建议增加关键点位复测记录。	2026-03-20 10:06:23.96033+08
\.


--
-- Data for Name: plan_status_changes; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.plan_status_changes (id, plan_id, from_status, to_status, changed_at) FROM stdin;
90000000-0000-0000-0000-000000000001	70000000-0000-0000-0000-000000000001	draft	pending	2026-03-18 10:06:23.96033+08
90000000-0000-0000-0000-000000000002	70000000-0000-0000-0000-000000000001	pending	approved	2026-03-20 10:06:23.96033+08
90000000-0000-0000-0000-000000000003	70000000-0000-0000-0000-000000000002	draft	pending	2026-03-26 10:06:23.96033+08
7667b211-99cd-42b7-ba42-37815a17be12	70000000-0000-0000-0000-000000000001	approved	in_progress	2026-03-31 13:46:26.693709+08
8c3def7e-d09a-461f-8b86-2a8d51179e7e	70000000-0000-0000-0000-000000000001	in_progress	completed	2026-03-31 13:46:31.106387+08
\.


--
-- Data for Name: project_murals; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.project_murals (project_id, mural_id) FROM stdin;
20000000-0000-0000-0000-000000000001	10000000-0000-0000-0000-000000000001
20000000-0000-0000-0000-000000000002	10000000-0000-0000-0000-000000000002
\.


--
-- Data for Name: project_phases; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.project_phases (id, project_id, name, "order", status, created_at, updated_at) FROM stdin;
30000000-0000-0000-0000-000000000011	20000000-0000-0000-0000-000000000001	评估与建档	1	completed	2026-03-10 10:06:23.96033+08	2026-03-16 10:06:23.96033+08
30000000-0000-0000-0000-000000000012	20000000-0000-0000-0000-000000000001	病害处理与加固	2	in_progress	2026-03-16 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
30000000-0000-0000-0000-000000000013	20000000-0000-0000-0000-000000000001	复核与归档	3	pending	2026-03-25 10:06:23.96033+08	2026-03-25 10:06:23.96033+08
30000000-0000-0000-0000-000000000021	20000000-0000-0000-0000-000000000002	现场勘查	1	in_progress	2026-03-22 10:06:23.96033+08	2026-03-29 10:06:23.96033+08
30000000-0000-0000-0000-000000000022	20000000-0000-0000-0000-000000000002	环境采样	2	pending	2026-03-24 10:06:23.96033+08	2026-03-24 10:06:23.96033+08
30000000-0000-0000-0000-000000000023	20000000-0000-0000-0000-000000000002	报告整理	3	pending	2026-03-25 10:06:23.96033+08	2026-03-25 10:06:23.96033+08
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.projects (id, name, description, status, progress, budget, start_date, end_date, created_at, updated_at) FROM stdin;
20000000-0000-0000-0000-000000000001	九原岗东壁抢救性修复	针对起甲、空鼓与颜料层剥落区域进行分区加固和表面清理。	in_progress	46	180000	2026-03-11 10:06:23.96033+08	\N	2026-03-10 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
20000000-0000-0000-0000-000000000002	娄睿墓壁画保护评估	完成病害普查与环境参数基线采集，形成评估报告。	pending	12	95000	2026-03-23 10:06:23.96033+08	\N	2026-03-22 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
\.


--
-- Data for Name: rest_tasks; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.rest_tasks (id, phase_id, title, description, status, created_at, updated_at) FROM stdin;
40000000-0000-0000-0000-000000000001	30000000-0000-0000-0000-000000000011	完成高精度正射影像采集	对东壁进行分区采样与影像拼接。	completed	2026-03-11 10:06:23.96033+08	2026-03-15 10:06:23.96033+08
40000000-0000-0000-0000-000000000002	30000000-0000-0000-0000-000000000012	注射加固空鼓区域	按网格分区注入改性材料并记录回弹率。	in_progress	2026-03-17 10:06:23.96033+08	2026-03-30 10:06:23.96033+08
40000000-0000-0000-0000-000000000003	30000000-0000-0000-0000-000000000013	提交阶段复核报告	汇总检测数据与施工日志。	pending	2026-03-26 10:06:23.96033+08	2026-03-26 10:06:23.96033+08
40000000-0000-0000-0000-000000000004	30000000-0000-0000-0000-000000000021	完成病害类型统计	按病害等级输出分层统计表。	in_progress	2026-03-23 10:06:23.96033+08	2026-03-29 10:06:23.96033+08
40000000-0000-0000-0000-000000000005	30000000-0000-0000-0000-000000000022	布设温湿度监测点	在甬道与主室设置长期监测点位。	pending	2026-03-24 10:06:23.96033+08	2026-03-24 10:06:23.96033+08
\.


--
-- Data for Name: restoration_plans; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.restoration_plans (id, annotation_id, method, materials, expected_result, status, created_at, updated_at, before_image, after_image, after_version) FROM stdin;
70000000-0000-0000-0000-000000000002	60000000-0000-0000-0000-000000000001	先做小样测试，再实施分层清洗与局部补色。	中性清洗剂、纤维素棉签、矿物颜料	污染层去除后不破坏原有彩绘边界。	pending	2026-03-25 10:06:23.96033+08	2026-03-29 10:06:23.96033+08	\N	\N	0
70000000-0000-0000-0000-000000000001	60000000-0000-0000-0000-000000000001	采用分区注射灌浆与表面微整固，先处理起甲边缘再回填空鼓层。	改性环氧树脂、低粘度加固剂、矿物颜料	起甲区域稳定，空鼓回弹率显著降低，色层连续性恢复。	completed	2026-03-17 10:06:23.96033+08	2026-03-31 13:46:31.107097+08	\N	\N	0
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.task_assignments (rest_task_id, user_id) FROM stdin;
\.


--
-- Data for Name: task_attachments; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.task_attachments (id, task_id, file_path, file_name, file_size, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: beiqi
--

COPY public.users (id, username, email, password, role, avatar, created_at, updated_at) FROM stdin;
382c3c71-3b5c-424f-9b61-0f2df5a98804	researcher	researcher@example.com	$2a$10$KrM/lE7IILjkcPJ7I3PwqOYV.DTQUz0la6gd2/l1VKE9XPWegpGrC	researcher	\N	2026-03-30 14:01:23.822961+08	2026-03-30 14:01:23.822961+08
51d524e0-e066-4be9-ba34-9c394583b41b	admin	admin@example.com	$2a$10$OAv4W2Zt5oADTfbA6smnSOXcg7/tKVdPNwROMNm6af4hErbAVVp6O	admin	\N	2026-03-30 14:01:23.587599+08	2026-03-30 14:01:23.587599+08
0f80575a-c147-4d92-af79-c057515f3fc8	chief_restorer	chief@example.com	$2a$10$kSWH2NqtQI4o7ICCJcfr6.HvZ5KVROAZoR9LR118jNPKW0ESdgrXa	chief_restorer	\N	2026-03-30 14:01:23.669299+08	2026-03-30 14:01:23.669299+08
09235d9c-09ee-4990-93e7-6ea43eeaa5b0	assistant	assistant@example.com	$2a$10$wzQa18jP/4w18N5v0TlziuFdkvWLclcRU6LWuEcY7V2cR3qLoIhcK	assistant	\N	2026-03-30 14:01:23.74528+08	2026-03-30 14:01:23.74528+08
02352c6e-3165-4938-bbaa-33065949e578	reviewer	reviewer@example.com	$2a$10$ZA.DPK9qRR.Lf.YEnkfs/OkE3fR9EfoQ0uifE0ID1DKXoGtELYwZW	reviewer	\N	2026-03-30 14:01:23.898395+08	2026-03-30 14:01:23.898395+08
f1f69915-c31b-4d5a-bbea-b62686ce3ae8	smoke_re_1774853799	smoke_re_1774853799@example.com	$2a$10$pvNH96/TDtWJYVGvI..pcu9386evby9S98crCm3AfSTnXHRKXjv/C	researcher	\N	2026-03-30 14:56:39.246518+08	2026-03-30 14:56:39.246518+08
c9a29714-c21e-4303-92ae-d2ab3dfe435c	smoke_re_1774854054	smoke_re_1774854054@example.com	$2a$10$fEJyVJpjA89NYDKI1CzBy.QDVogMfsUa7ZsLjapxI6yryZuZVHE26	researcher	\N	2026-03-30 15:00:54.500874+08	2026-03-30 15:00:54.875473+08
048e00c5-d787-4036-8467-9f3af6857b7b	smoke_admin_1774854054	smoke_admin_1774854054@example.com	$2a$10$XJ7RvQcCHrE2iPsQ.7zbdePqToyrxaerRR//H.awRxmq7LoRwdbwK	admin	\N	2026-03-30 15:00:55.140945+08	2026-03-30 15:00:55.140945+08
401eecd6-a8d9-4fe8-adb0-e40cfc89fc0f	smoke_researcher_1774855732	smoke_researcher_1774855732@example.com	$2a$10$wDN74KM4RxiZM8uPoME1IeZcxgk/aDQHnwb4xxV7XRcXRYDHmdJKm	researcher	\N	2026-03-30 15:28:52.704767+08	2026-03-30 15:28:53.152934+08
148cb98c-be59-46af-86bf-e39ef61c6f53	smoke_admin_1774855732	smoke_admin_1774855732@example.com	$2a$10$Yi12IQKzsHTdTsF.NYFcIevEFlt6tpHPluGIQz965CuWK8dBDJNkO	admin	\N	2026-03-30 15:28:53.319743+08	2026-03-31 13:38:08.232694+08
\.


--
-- Name: annotation_snapshots annotation_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.annotation_snapshots
    ADD CONSTRAINT annotation_snapshots_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: damage_annotations damage_annotations_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.damage_annotations
    ADD CONSTRAINT damage_annotations_pkey PRIMARY KEY (id);


--
-- Name: knowledge_docs knowledge_docs_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.knowledge_docs
    ADD CONSTRAINT knowledge_docs_pkey PRIMARY KEY (id);


--
-- Name: material_records material_records_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.material_records
    ADD CONSTRAINT material_records_pkey PRIMARY KEY (id);


--
-- Name: mural_histories mural_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.mural_histories
    ADD CONSTRAINT mural_histories_pkey PRIMARY KEY (id);


--
-- Name: mural_images mural_images_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.mural_images
    ADD CONSTRAINT mural_images_pkey PRIMARY KEY (id);


--
-- Name: murals murals_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.murals
    ADD CONSTRAINT murals_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: plan_reviews plan_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.plan_reviews
    ADD CONSTRAINT plan_reviews_pkey PRIMARY KEY (id);


--
-- Name: plan_status_changes plan_status_changes_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.plan_status_changes
    ADD CONSTRAINT plan_status_changes_pkey PRIMARY KEY (id);


--
-- Name: project_murals project_murals_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.project_murals
    ADD CONSTRAINT project_murals_pkey PRIMARY KEY (project_id, mural_id);


--
-- Name: project_phases project_phases_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.project_phases
    ADD CONSTRAINT project_phases_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: rest_tasks rest_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.rest_tasks
    ADD CONSTRAINT rest_tasks_pkey PRIMARY KEY (id);


--
-- Name: restoration_plans restoration_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.restoration_plans
    ADD CONSTRAINT restoration_plans_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (rest_task_id, user_id);


--
-- Name: task_attachments task_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT task_attachments_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_annotation_snapshots_annotation_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_annotation_snapshots_annotation_id ON public.annotation_snapshots USING btree (annotation_id);


--
-- Name: idx_audit_logs_user_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);


--
-- Name: idx_damage_annotations_mural_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_damage_annotations_mural_id ON public.damage_annotations USING btree (mural_id);


--
-- Name: idx_material_records_project_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_material_records_project_id ON public.material_records USING btree (project_id);


--
-- Name: idx_mural_histories_mural_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_mural_histories_mural_id ON public.mural_histories USING btree (mural_id);


--
-- Name: idx_mural_images_mural_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_mural_images_mural_id ON public.mural_images USING btree (mural_id);


--
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE UNIQUE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- Name: idx_password_reset_tokens_user_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);


--
-- Name: idx_plan_reviews_plan_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_plan_reviews_plan_id ON public.plan_reviews USING btree (plan_id);


--
-- Name: idx_plan_status_changes_plan_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_plan_status_changes_plan_id ON public.plan_status_changes USING btree (plan_id);


--
-- Name: idx_project_phases_project_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_project_phases_project_id ON public.project_phases USING btree (project_id);


--
-- Name: idx_rest_tasks_phase_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_rest_tasks_phase_id ON public.rest_tasks USING btree (phase_id);


--
-- Name: idx_restoration_plans_annotation_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_restoration_plans_annotation_id ON public.restoration_plans USING btree (annotation_id);


--
-- Name: idx_task_attachments_task_id; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE INDEX idx_task_attachments_task_id ON public.task_attachments USING btree (task_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: beiqi
--

CREATE UNIQUE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: audit_logs fk_audit_logs_user; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: damage_annotations fk_murals_annotations; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.damage_annotations
    ADD CONSTRAINT fk_murals_annotations FOREIGN KEY (mural_id) REFERENCES public.murals(id);


--
-- Name: mural_images fk_murals_images; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.mural_images
    ADD CONSTRAINT fk_murals_images FOREIGN KEY (mural_id) REFERENCES public.murals(id);


--
-- Name: project_murals fk_project_murals_mural; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.project_murals
    ADD CONSTRAINT fk_project_murals_mural FOREIGN KEY (mural_id) REFERENCES public.murals(id);


--
-- Name: project_murals fk_project_murals_project; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.project_murals
    ADD CONSTRAINT fk_project_murals_project FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: rest_tasks fk_project_phases_tasks; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.rest_tasks
    ADD CONSTRAINT fk_project_phases_tasks FOREIGN KEY (phase_id) REFERENCES public.project_phases(id);


--
-- Name: material_records fk_projects_materials; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.material_records
    ADD CONSTRAINT fk_projects_materials FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_phases fk_projects_phases; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.project_phases
    ADD CONSTRAINT fk_projects_phases FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: task_attachments fk_rest_tasks_attachments; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.task_attachments
    ADD CONSTRAINT fk_rest_tasks_attachments FOREIGN KEY (task_id) REFERENCES public.rest_tasks(id);


--
-- Name: plan_reviews fk_restoration_plans_reviews; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.plan_reviews
    ADD CONSTRAINT fk_restoration_plans_reviews FOREIGN KEY (plan_id) REFERENCES public.restoration_plans(id);


--
-- Name: plan_status_changes fk_restoration_plans_status_changes; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.plan_status_changes
    ADD CONSTRAINT fk_restoration_plans_status_changes FOREIGN KEY (plan_id) REFERENCES public.restoration_plans(id);


--
-- Name: task_assignments fk_task_assignments_rest_task; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT fk_task_assignments_rest_task FOREIGN KEY (rest_task_id) REFERENCES public.rest_tasks(id);


--
-- Name: task_assignments fk_task_assignments_user; Type: FK CONSTRAINT; Schema: public; Owner: beiqi
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT fk_task_assignments_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict KpabpC2hV1jvHomvenzFhLFc7My4DsKoOoBuINmh1MvewXJ0vxRFYv2hNNFcwKg

