// For legal and security concerns, we typically only allow Web Fetch to access
// domains that the user has provided in some form. However, we make an
// exception for a list of preapproved domains that are code-related.
//
// SECURITY WARNING: These preapproved domains are ONLY for WebFetch (GET requests only).
// The sandbox system deliberately does NOT inherit this list for network restrictions,
// as arbitrary network access (POST, uploads, etc.) to these domains could enable
// data exfiltration. Some domains like huggingface.co, kaggle.com, and nuget.org
// allow file uploads and would be dangerous for unrestricted network access.
//
// See test/utils/sandbox/webfetch-preapproved-separation.test.ts for verification
// that sandbox network restrictions require explicit user permission rules.

// PREAPPROVED_HOSTS 集合保存`Set`，供工具调用后续处理使用。
export const PREAPPROVED_HOSTS = new Set([
  // Anthropic
  'platform.claude.com',
  'code.claude.com',
  'modelcontextprotocol.io',
  'github.com/anthropics',
  'agentskills.io',

  // Top Programming Languages
  'docs.python.org', // Python
  'en.cppreference.com', // C/C++ reference
  'docs.oracle.com', // Java
  'learn.microsoft.com', // C#/.NET
  'developer.mozilla.org', // JavaScript/Web APIs (MDN)
  'go.dev', // Go
  'pkg.go.dev', // Go docs
  'www.php.net', // PHP
  'docs.swift.org', // Swift
  'kotlinlang.org', // Kotlin
  'ruby-doc.org', // Ruby
  'doc.rust-lang.org', // Rust
  'www.typescriptlang.org', // TypeScript

  // Web & JavaScript Frameworks/Libraries
  'react.dev', // React
  'angular.io', // Angular
  'vuejs.org', // Vue.js
  'nextjs.org', // Next.js
  'expressjs.com', // Express.js
  'nodejs.org', // Node.js
  'bun.sh', // Bun
  'jquery.com', // jQuery
  'getbootstrap.com', // Bootstrap
  'tailwindcss.com', // Tailwind CSS
  'd3js.org', // D3.js
  'threejs.org', // Three.js
  'redux.js.org', // Redux
  'webpack.js.org', // Webpack
  'jestjs.io', // Jest
  'reactrouter.com', // React Router

  // Python Frameworks & Libraries
  'docs.djangoproject.com', // Django
  'flask.palletsprojects.com', // Flask
  'fastapi.tiangolo.com', // FastAPI
  'pandas.pydata.org', // Pandas
  'numpy.org', // NumPy
  'www.tensorflow.org', // TensorFlow
  'pytorch.org', // PyTorch
  'scikit-learn.org', // Scikit-learn
  'matplotlib.org', // Matplotlib
  'requests.readthedocs.io', // Requests
  'jupyter.org', // Jupyter

  // PHP Frameworks
  'laravel.com', // Laravel
  'symfony.com', // Symfony
  'wordpress.org', // WordPress

  // Java Frameworks & Libraries
  'docs.spring.io', // Spring
  'hibernate.org', // Hibernate
  'tomcat.apache.org', // Tomcat
  'gradle.org', // Gradle
  'maven.apache.org', // Maven

  // .NET & C# Frameworks
  'asp.net', // ASP.NET
  'dotnet.microsoft.com', // .NET
  'nuget.org', // NuGet
  'blazor.net', // Blazor

  // Mobile Development
  'reactnative.dev', // React Native
  'docs.flutter.dev', // Flutter
  'developer.apple.com', // iOS/macOS
  'developer.android.com', // Android

  // Data Science & Machine Learning
  'keras.io', // Keras
  'spark.apache.org', // Apache Spark
  'huggingface.co', // Hugging Face
  'www.kaggle.com', // Kaggle

  // Databases
  'www.mongodb.com', // MongoDB
  'redis.io', // Redis
  'www.postgresql.org', // PostgreSQL
  'dev.mysql.com', // MySQL
  'www.sqlite.org', // SQLite
  'graphql.org', // GraphQL
  'prisma.io', // Prisma

  // Cloud & DevOps
  'docs.aws.amazon.com', // AWS
  'cloud.google.com', // Google Cloud
  'learn.microsoft.com', // Azure
  'kubernetes.io', // Kubernetes
  'www.docker.com', // Docker
  'www.terraform.io', // Terraform
  'www.ansible.com', // Ansible
  'vercel.com/docs', // Vercel
  'docs.netlify.com', // Netlify
  'devcenter.heroku.com', // Heroku

  // Testing & Monitoring
  'cypress.io', // Cypress
  'selenium.dev', // Selenium

  // Game Development
  'docs.unity.com', // Unity
  'docs.unrealengine.com', // Unreal Engine

  // Other Essential Tools
  'git-scm.com', // Git
  'nginx.org', // Nginx
  'httpd.apache.org', // Apache HTTP Server
])

// Split once at module load so lookups are O(1) Set.has() for the common
// hostname-only case, falling back to a small per-host path-prefix list
// for the handful of path-scoped entries (e.g., "github.com/anthropics").
// 这个回调绑定到 const { HOSTNAME_ONLY, PATH_PREFIXES } = (() => {，负责工具调用在该局部场景下的响应。
const { HOSTNAME_ONLY, PATH_PREFIXES } = (() => {
  // hosts 集合 命名 `new Set<string>()`，让后续代码直接表达这个值的用途。
  const hosts = new Set<string>()
  // 路径列表构建`new Map<string, string[]>()`，供后续判断或组装使用。
  const paths = new Map<string, string[]>()
  // 按顺序遍历 `PREAPPROVED_HOSTS` 中的entry，逐个交给工具调用处理。
  for (const entry of PREAPPROVED_HOSTS) {
    // slash保存`entry.indexOf`，供工具调用后续处理使用。
    const slash = entry.indexOf('/')
    // 满足 `slash === -1` 时，工具调用执行该分支。
    if (slash === -1) {
      // 调用 hosts.add，触发工具调用此处需要的副作用。
      hosts.add(entry)
    } else {
      // host格式化`entry.slice`，供工具调用后续处理使用。
      const host = entry.slice(0, slash)
      // 路径格式化`entry.slice`，供工具调用后续处理使用。
      const path = entry.slice(slash)
      // prefixes 集合读取`paths.get`，供工具调用后续处理使用。
      const prefixes = paths.get(host)
      // 满足 `prefixes) prefixes.push(path` 时，工具调用执行该分支。
      if (prefixes) prefixes.push(path)
      else paths.set(host, [path])
    }
  }
  // 返回结构化结果，集中表达工具调用已经整理出的状态。
  return { HOSTNAME_ONLY: hosts, PATH_PREFIXES: paths }
})()

// isPreapprovedHost 封装工具调用的一段完整流程，把输入整理、状态决策和输出组合在同一个入口中。
export function isPreapprovedHost(hostname: string, pathname: string): boolean {
  // 满足 `HOSTNAME_ONLY.has(hostname)` 时，工具调用执行该分支。
  if (HOSTNAME_ONLY.has(hostname)) return true
  // prefixes 集合读取`PATH_PREFIXES.get`，供工具调用后续处理使用。
  const prefixes = PATH_PREFIXES.get(hostname)
  // 满足 `prefixes` 时，工具调用执行该分支。
  if (prefixes) {
    // 按顺序遍历 `prefixes` 中的p，逐个交给工具调用处理。
    for (const p of prefixes) {
      // Enforce path segment boundaries: "/anthropics" must not match
      // "/anthropics-evil/malware". Only exact match or a "/" after the
      // prefix is allowed.
      // 只有 `pathname === p || pathname.startsWith(p + '/')` 满足时，工具调用才执行该分支。
      if (pathname === p || pathname.startsWith(p + '/')) return true
    }
  }
  // 返回 false 表示当前检查未通过，调用方会跳过或拒绝该路径。
  return false
}
