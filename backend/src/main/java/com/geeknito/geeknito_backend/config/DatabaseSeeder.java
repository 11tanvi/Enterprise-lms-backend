package com.geeknito.geeknito_backend.config;

import com.geeknito.geeknito_backend.category.repository.CategoryRepository;
import com.geeknito.geeknito_backend.course.repository.ContentRepository;
import com.geeknito.geeknito_backend.course.repository.CourseRepository;
import com.geeknito.geeknito_backend.course.repository.ModuleRepository;
import com.geeknito.geeknito_backend.course.repository.SubmoduleRepository;
import com.geeknito.geeknito_backend.user.repository.UserRepository;
import com.geeknito.geeknito_backend.entity.learning.CategoryEntity;
import com.geeknito.geeknito_backend.entity.learning.ContentEntity;
import com.geeknito.geeknito_backend.entity.learning.CourseEntity;
import com.geeknito.geeknito_backend.entity.learning.ModuleEntity;
import com.geeknito.geeknito_backend.entity.learning.SubmoduleEntity;
import com.geeknito.geeknito_backend.entity.learning.UserEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * DatabaseSeeder
 * 
 * Safely seeds the database with initial admin and curriculum data.
 * Isolated to 'local' and 'dev' profiles; will NEVER run in production.
 * Operations are fully idempotent and check for pre-existing records first.
 */
@Component
@Profile({"local", "dev"})
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final CourseRepository courseRepository;
    private final ModuleRepository moduleRepository;
    private final SubmoduleRepository submoduleRepository;
    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Enterprise LMS Database Seeding process...");

        // Make user seeding idempotent and production-safe
        if (userRepository.count() == 0) {
            log.info("No users found in database. Seeding default enterprise role-based users...");

            UserEntity admin = UserEntity.builder()
                    .fullName("Alex Rivera")
                    .email("admin@educorp.com")
                    .password(passwordEncoder.encode("adminpass123")) // BCrypt-encoded
                    .role("admin")
                    .isActive(true)
                    .build();

            UserEntity student = UserEntity.builder()
                    .fullName("Emma Watson")
                    .email("student@educorp.com")
                    .password(passwordEncoder.encode("studentpass123")) // BCrypt-encoded
                    .role("student")
                    .isActive(true)
                    .build();

            userRepository.save(admin);
            userRepository.save(student);
            log.info("Seeded default users (Admin: admin@educorp.com, Student: student@educorp.com)");
        } else {
            log.info("Existing user records detected. Skipping initial user seeding.");
        }

        if (userRepository.findByEmail("teacher@educorp.com").isEmpty()) {
            log.info("Teacher user not found. Seeding default teacher user...");
            UserEntity teacher = UserEntity.builder()
                    .fullName("Teacher User")
                    .email("teacher@educorp.com")
                    .password(passwordEncoder.encode("teacherpass123")) // BCrypt-encoded
                    .role("teacher")
                    .isActive(true)
                    .build();
            userRepository.save(teacher);
            log.info("Seeded default teacher user (teacher@educorp.com)");
        } else {
            log.info("Teacher user already exists. Skipping teacher seeding.");
        }

        // Make category and content curriculum seeding idempotent
        if (categoryRepository.count() == 0) {
            log.info("No curriculum categories found. Seeding premium LMS categories and courses...");

            // 2. Create Premium Categories
            log.info("Creating premium LMS curriculum categories...");
            CategoryEntity cloudCat = CategoryEntity.builder()
                    .name("Cloud Architecture")
                    .icon("☁️")
                    .description("Master public and private cloud design, scalability, and security across AWS, Azure, and GCP.")
                    .color("#0284C7")
                    .isActive(true)
                    .build();

            CategoryEntity cyberCat = CategoryEntity.builder()
                    .name("Cybersecurity")
                    .icon("🛡️")
                    .description("Learn modern threat intelligence, zero-trust network engineering, incident response, and compliance.")
                    .color("#DC2626")
                    .isActive(true)
                    .build();

            CategoryEntity devCat = CategoryEntity.builder()
                    .name("Software Engineering")
                    .icon("💻")
                    .description("Build highly scalable backend services, event-driven architectures, and modern web systems.")
                    .color("#059669")
                    .isActive(true)
                    .build();

            cloudCat = categoryRepository.save(cloudCat);
            cyberCat = categoryRepository.save(cyberCat);
            devCat = categoryRepository.save(devCat);

        // 3. Create Premium Courses per Category
        log.info("Seeding premium enterprise courses...");

        // Category 1: Cloud Architecture Courses
        CourseEntity awsCourse = CourseEntity.builder()
                .title("AWS Certified Solutions Architect")
                .slug("aws-solutions-architect")
                .thumbnail("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop")
                .shortDescription("Design highly available, cost-efficient, fault-tolerant, and secure systems on AWS.")
                .description("This comprehensive, production-grade course is designed for solutions architects and developers. Learn core AWS services including VPC subnets, secure IAM roles, EC2 autoscaling, ECS container deployment, serverless AWS Lambda, RDS replication, and highly persistent S3 storage buckets.")
                .level("Intermediate")
                .duration("40 hours")
                .isActive(true)
                .category(cloudCat)
                .build();

        CourseEntity gcpCourse = CourseEntity.builder()
                .title("Google Cloud Platform Fundamentals")
                .slug("gcp-fundamentals")
                .thumbnail("https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=600&auto=format&fit=crop")
                .shortDescription("Get started with GCP's computing power, container management, and scalable serverless runtimes.")
                .description("Explore Google Cloud Platform's key infrastructure options. Learn to manage Google Compute Engine instances, design high-performance networks, deploy enterprise-ready Kubernetes clusters with GKE, and execute fast, event-driven processes with Cloud Functions.")
                .level("Beginner")
                .duration("15 hours")
                .isActive(true)
                .category(cloudCat)
                .build();

        courseRepository.save(awsCourse);
        courseRepository.save(gcpCourse);

        // Category 2: Cybersecurity Courses
        CourseEntity zeroTrustCourse = CourseEntity.builder()
                .title("Zero-Trust Network Security")
                .slug("zero-trust-security")
                .thumbnail("https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=600&auto=format&fit=crop")
                .shortDescription("Design, implement, and validate robust zero-trust access structures for modern workspaces.")
                .description("As network perimeters dissolve, authentication is everything. Learn to implement micro-segmentation, configure dynamic Identity-Aware Proxies, enforce multi-factor continuous validation policies, and coordinate secure API gateways.")
                .level("Advanced")
                .duration("30 hours")
                .isActive(true)
                .category(cyberCat)
                .build();

        CourseEntity pentestCourse = CourseEntity.builder()
                .title("Certified Ethical Hacker Prep")
                .slug("ethical-hacker-prep")
                .thumbnail("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=600&auto=format&fit=crop")
                .shortDescription("Master penetration testing methodologies, network vulnerability analysis, and payload delivery.")
                .description("Unlock industry-standard penetration testing techniques in highly controlled virtual laboratories. Understand packet analysis using Wireshark, map target topologies with Nmap, execute controlled exploits with Metasploit, and secure systems against active threat vectors.")
                .level("Intermediate")
                .duration("35 hours")
                .isActive(true)
                .category(cyberCat)
                .build();

        courseRepository.save(zeroTrustCourse);
        courseRepository.save(pentestCourse);

        // Category 3: Software Engineering Courses (With Deeper Curriculum)
        CourseEntity javaCourse = CourseEntity.builder()
                .title("Modern Backend Architectures in Java")
                .slug("modern-backend-java")
                .thumbnail("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop")
                .shortDescription("Build resilient, high-throughput microservices using Spring Boot, Hibernate, and Apache Kafka.")
                .description("Take your backend Java skills to the enterprise level. Learn to structure scalable RESTful APIs, manage transaction safety with Spring Data JPA, containerize services using Docker, optimize query execution, and implement reliable microservices with distributed message brokers.")
                .level("Advanced")
                .duration("25 hours")
                .isActive(true)
                .category(devCat)
                .build();

        javaCourse = courseRepository.save(javaCourse);

        // 4. Build Deep Curriculum ("Wow" Factor) for "Modern Backend Architectures in Java"
        log.info("Seeding modules and submodules for 'Modern Backend Architectures in Java'...");

        // Module 1: Foundations of Spring Boot & JPA
        ModuleEntity mod1 = ModuleEntity.builder()
                .title("Foundations of Spring Boot & JPA")
                .description("Kickstart your backend development by understanding core dependency inversion, container lifecycles, and relational database integrations.")
                .moduleOrder(1)
                .isActive(true)
                .course(javaCourse)
                .build();

        mod1 = moduleRepository.save(mod1);

        // Module 1 - Submodule 1: Dependency Injection
        SubmoduleEntity sub1_1 = SubmoduleEntity.builder()
                .title("Dependency Injection & Bean Lifecycle")
                .slug("spring-core-di")
                .description("Dive into how the Spring Inversion of Control (IoC) Container instantiates, configures, manages, and resolves dependencies between components.")
                .submoduleOrder(1)
                .isActive(true)
                .module(mod1)
                .build();

        sub1_1 = submoduleRepository.save(sub1_1);

        // Submodule 1.1 Content Blocks (The 3 realistic blocks)
        ContentEntity textBlock = ContentEntity.builder()
                .title("Inversion of Control (IoC) Explained")
                .type("text")
                .text("In traditional programming, objects explicitly instantiate their dependencies. In Spring, the framework takes over this lifecycle management, a design principle known as **Inversion of Control (IoC)**. By annotating Java classes with `@Component`, `@Service`, or `@Repository`, you register them as Spring beans. Spring then handles the constructor wiring automatically, resulting in highly decoupled, easily testable architectures.")
                .contentOrder(1)
                .isActive(true)
                .submodule(sub1_1)
                .build();

        ContentEntity videoBlock = ContentEntity.builder()
                .title("Visualizing Dependency Injection and Configuration Options")
                .type("video")
                .videoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ") // Standard placeholder video URL
                .contentOrder(2)
                .isActive(true)
                .submodule(sub1_1)
                .build();

        ContentEntity codeBlock = ContentEntity.builder()
                .title("Declaring a Service with Constructor-Based Autowiring")
                .type("code")
                .code("@Service\n" +
                      "public class EnrollmentService {\n" +
                      "\n" +
                      "    private final StudentRepository studentRepository;\n" +
                      "    private final CourseRepository courseRepository;\n" +
                      "\n" +
                      "    @Autowired\n" +
                      "    public EnrollmentService(StudentRepository studentRepo, CourseRepository courseRepo) {\n" +
                      "        this.studentRepository = studentRepo;\n" +
                      "        this.courseRepository = courseRepo;\n" +
                      "    }\n" +
                      "\n" +
                      "    public boolean isStudentEnrolled(Long studentId, Long courseId) {\n" +
                      "        return studentRepository.existsByIdAndEnrolledCoursesId(studentId, courseId);\n" +
                      "    }\n" +
                      "}")
                .language("java")
                .contentOrder(3)
                .isActive(true)
                .submodule(sub1_1)
                .build();

        contentRepository.save(textBlock);
        contentRepository.save(videoBlock);
        contentRepository.save(codeBlock);

        // Module 1 - Submodule 2: JPA Relations
        SubmoduleEntity sub1_2 = SubmoduleEntity.builder()
                .title("Mapping Relationships and Cascade Operations")
                .slug("mapping-entities-jpa")
                .description("Understand how to cleanly map database relationships using Hibernate's One-to-Many, Many-to-One, and cascade types.")
                .submoduleOrder(2)
                .isActive(true)
                .module(mod1)
                .build();

        submoduleRepository.save(sub1_2);


        // Module 2: Advanced Microservices & Scaling
        ModuleEntity mod2 = ModuleEntity.builder()
                .title("Advanced Microservices & Scaling")
                .description("Transform monolithic Java systems into microservices utilizing container orchestration and asynchronous distributed messaging queues.")
                .moduleOrder(2)
                .isActive(true)
                .course(javaCourse)
                .build();

        mod2 = moduleRepository.save(mod2);

        // Module 2 - Submodule 1: Docker
        SubmoduleEntity sub2_1 = SubmoduleEntity.builder()
                .title("Containerizing Java with Multi-Stage Dockerfiles")
                .slug("dockerizing-java-apps")
                .description("Package compiled bytecode securely. Build optimized JRE-only final execution containers with multi-stage build strategies.")
                .submoduleOrder(1)
                .isActive(true)
                .module(mod2)
                .build();

        submoduleRepository.save(sub2_1);

        // Module 2 - Submodule 2: Kafka
        SubmoduleEntity sub2_2 = SubmoduleEntity.builder()
                .title("Asynchronous Messaging with Apache Kafka")
                .slug("kafka-event-driven")
                .description("Learn event-driven publishing and subscribing patterns. Implement resilient message consumption with consumer groups and deserialization.")
                .submoduleOrder(2)
                .isActive(true)
                .module(mod2)
                .build();

        submoduleRepository.save(sub2_2);
            log.info("LMS database seeding completed successfully!");
        } else {
            log.info("Existing curriculum data detected. Skipping curriculum seeding.");
        }
    }
}
