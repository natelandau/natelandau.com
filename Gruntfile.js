module.exports = function (grunt) {
    grunt.initConfig({
        // -------------------------------
        // Variables
        // -------------------------------

        env: {
            dev: {
                HOST: "localhost",
                PORT: 8000,
                URL: "http://<%= env.dev.HOST %>:<%= env.dev.PORT %>",
                DIR: "_site",
            },
            stage: {
                HOST: "localhost",
                PORT: 8888,
                URL: "http://<%= env.stage.HOST %>:<%= env.stage.PORT %>",
                DIR: "_siteStage",
            },
            prod: {
                HOST: "natelandau.com",
                URL: "https://<%= env.prod.HOST %>",
                DIR: "_siteProd",
            },
        },

        // -------------------------------
        // Plugins and Actions
        // -------------------------------
        shell: {
            traceVars: {
                command: 'echo " DIR: <%= DIR %>\n HOST: <%= HOST %>\n PORT: <%= PORT %>\n URL: <%= URL %>"',
            },
            lint_htmlproofer: {
                command:
                    "bundle exec htmlproofer <%= DIR %> --disable-external --check-favicon --allow-hash-href --extension .html",
            },
            lint_html: {
                command: "npx htmlhint <%= DIR %>",
            },
            lint_json: {
                command: ["npx jsonlint -q <%= DIR %>/**/*.json", "npx jsonlint -q <%= DIR %>/*.json"].join("&&"),
            },
            lint_xml: {
                command: ["xmllint --noout <%= DIR %>/**/*.xml", "xmllint --noout <%= DIR %>/*.xml"].join("&&"),
            },
            lint_less: {
                command: "npx stylelint --config=.stylelintrc.yml site/**/*.less",
            },
            prettier: {
                command: [
                    'npx prettier --write --ignore-unknown "<%= DIR %>/**/*.{js,css,json,md}"',
                    'npx prettier --write --ignore-unknown "<%= DIR %>/*.{js,css,json,md}"',
                ].join("&&"),
            },
            minifyXML: {
                command: [
                    "for file in <%= DIR %>/**/*.xml; do npx minify-xml --in-place $file; done",
                    "for file in <%= DIR %>/*.xml; do npx minify-xml --in-place $file; done",
                ].join("&&"),
            },
        }, // end shell

        less: {
            map: {
                options: {
                    compress: false,
                    optimization: 1,
                    sourceMap: true,
                    javascriptEnabled: true,
                    outputSourceFiles: true, // Puts the LESS files into the map instead of referencing them
                    syncImport: true, // Read @imported files
                    sourceMapURL: "/assets/compiled_less.css.map",
                },
                files: {
                    "site/assets/compiled_less.css": "site/_less/styles.less",
                },
            },
            no_map: {
                options: {
                    compress: false,
                    optimization: 1,
                    sourceMap: false,
                    javascriptEnabled: true,
                    syncImport: true, // Read @imported files
                },
                files: {
                    "site/assets/compiled_less.css": "site/_less/styles.less",
                },
            },
        }, // end less

        purgecss: {
            run: {
                files: {
                    "<%= DIR %>/assets/site.css": ["<%= DIR %>/assets/compiled_less.css"],
                },
                options: {
                    content: ["<%= DIR %>/**/*.html"],
                },
            },
        }, // end purgecess

        cssmin: {
            run: {
                options: {
                    roundingPrecision: -1,
                    keepSpecialComments: 0,
                    restructure: true,
                    sourceMap: false,
                    sourceMapInlineSources: false,
                    removeDuplicates: true,
                },
                files: {
                    "<%= DIR %>/assets/site.min.css": ["<%= DIR %>/assets/site.css"],
                },
            },
        }, // end cssmin

        jshint: {
            options: {
                jshintrc: true,
                reporter: require("jshint-stylish"),
            },
            beforeconcat: ["site/_js/{,*/}*.js", "!site/_js/autotrack.js", "!site/_js/jquery.min.js"],
        },

        uglify: {
            beautify: {
                options: {
                    mangle: false,
                    compress: false,
                    beautify: true,
                },
                files: {
                    "site/assets/customScripts.js": [
                        "site/_js/jquery.min.js",
                        "site/_js/autotrack.js",
                        "site/_js/custom.js",
                        "site/_js/jquery.fitvids.js",
                        "site/_js/webfont.js",
                    ],
                },
            }, // end dev
            compress: {
                options: {
                    mangle: false,
                    compress: true,
                },
                files: {
                    "site/assets/customScripts.js": [
                        "site/_js/jquery.min.js",
                        "site/_js/autotrack.js",
                        "site/_js/custom.js",
                        "site/_js/jquery.fitvids.js",
                        "site/_js/webfont.js",
                    ],
                },
            }, // end prod
        }, // end uglify

        htmlmin: {
            run: {
                options: {
                    collapseBooleanAttributes: true,
                    collapseWhitespace: true,
                    minifyCSS: true,
                    minifyJS: true,
                    removeAttributeQuotes: false,
                    removeComments: true,
                    removeEmptyAttributes: true,
                    removeRedundantAttributes: true,
                },
                files: [
                    {
                        expand: true,
                        cwd: "<%= DIR %>",
                        src: ["**/*.html"],
                        dest: "<%= DIR %>",
                    },
                ],
            }, // end run
        }, // end htmlmin

        clean: {
            build_dir: ["<%= DIR %>/*"],
        }, // end clean

        jekyll: {
            options: {
                bundleExec: true,
            },
            dev: {
                options: {
                    config: "_config.yml",
                    incremental: true,
                    drafts: true,
                    future: true,
                },
            },
            stage_local: {
                options: {
                    config: "_config.yml,_config_staging_local.yml",
                    incremental: false,
                },
            },
            stage_deploy: {
                options: {
                    config: "_config.yml,_config_staging_deploy.yml",
                    incremental: false,
                },
            },
            prod: {
                options: {
                    config: "_config.yml,_config_production.yml",
                    incremental: false,
                },
            },
        }, // end jekyll

        cacheBust: {
            run: {
                options: {
                    // assets: ["assets/**/*.{css,js}"],
                    assets: ["assets/site.min.css"],
                    baseDir: "<%= DIR %>",
                    urlPrefixes: ["<%= URL %>"],
                },
                src: ["<%= DIR %>/index.html"],

                // src: ["<%= DIR %>/**/*.html"],
            },
        },

        compress: {
            prod: {
                options: {
                    mode: "gzip",
                    pretty: true,
                },
                expand: true,
                cwd: "<%= env.prod.DIR %>/",
                src: ["**/*"],
                dest: "<%= env.prod.DIR %>/",
            },
        }, // end compress

        watch: {
            less: {
                options: {
                    interrupt: true,
                },
                files: ["site/_less/**/*.less"],
                tasks: ["less:map"],
            },
            dev: {
                options: {
                    interrupt: true,
                    livereload: true,
                },
                tasks: ["jekyll:dev"],
                files: [
                    "site/**/.yml",
                    "site/**/*.html",
                    "site/**/*.md",
                    "site/**/*.xml",
                    "site/**/*.json",
                    "site/**/*.txt",
                    "site/**/*.rb",
                    "site/**/*.css",
                    "_site/**/*.js",
                ],
            },
        }, // end watch

        connect: {
            dev: {
                options: {
                    port: "<%= env.dev.PORT %>",
                    base: "<%= env.dev.DIR %>",
                    livereload: true,
                    open: true,
                    hostname: "*",
                    keepalive: true,
                    protocol: "https",
                },
            },
            stage: {
                options: {
                    port: "<%= env.stage.PORT %>",
                    base: "<%= env.stage.DIR %>",
                    livereload: true,
                    open: true,
                    hostname: "*",
                    keepalive: true,
                    protocol: "https",
                },
            },
        }, // end connect

        concurrent: {
            dev: {
                options: {
                    logConcurrentOutput: true,
                },
                tasks: ["env:dev", "loadVars", "connect:dev", "watch:less", "watch:dev"],
            },
        }, // end concurrent
    }); // end initConfig

    // -------------------------------
    // Load Grunt plugins
    // -------------------------------
    grunt.loadNpmTasks("grunt-cache-bust");
    grunt.loadNpmTasks("grunt-concurrent");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-connect");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-htmlmin");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-env");
    grunt.loadNpmTasks("grunt-jekyll");
    grunt.loadNpmTasks("grunt-purgecss");
    grunt.loadNpmTasks("grunt-shell");

    // -------------------------------
    // Shared tasks
    // -------------------------------

    grunt.registerTask("loadVars", "Load Environment Variables", function () {
        grunt.config("DIR", process.env.DIR);
        grunt.config("PORT", process.env.PORT);
        grunt.config("HOST", process.env.HOST);
        grunt.config("URL", process.env.URL);
    });

    grunt.registerTask("common_pre_build", ["jshint:beforeconcat", "shell:lint_less"]);

    grunt.registerTask("common_post_build", [
        "shell:lint_htmlproofer",
        "shell:lint_html",
        "shell:lint_json",
        "shell:lint_xml",
        "shell:minifyXML",
    ]);

    // -------------------------------
    // Callable tasks
    // -------------------------------

    grunt.registerTask("build_dev", [
        "env:dev",
        "loadVars",
        "shell:traceVars",
        "common_pre_build",
        "clean:build_dir",
        "less:map",
        "uglify:beautify",
        "jekyll:dev",
        "common_post_build",
        "shell:prettier",
    ]);

    grunt.registerTask("build_stage", [
        "env:stage",
        "loadVars",
        "shell:traceVars",
        "common_pre_build",
        "clean:build_dir",
        "less:no_map",
        "uglify:compress",
        "jekyll:stage_local",
        "purgecss:run",
        "cssmin:run",
        "htmlmin:run",
        "cacheBust:run",
        "common_post_build",
    ]);

    grunt.registerTask("build_stage_deploy", [
        "env:prod",
        "loadVars",
        "shell:traceVars",
        "common_pre_build",
        "clean:build_dir",
        "less:no_map",
        "uglify:compress",
        "jekyll:stage_deploy",
        "purgecss:run",
        "cssmin:run",
        "htmlmin:run",
        "cacheBust:run",
        "common_post_build",
        "compress:prod",
    ]);

    grunt.registerTask("build_prod", [
        "env:prod",
        "loadVars",
        "shell:traceVars",
        "common_pre_build",
        "clean:build_dir",
        "less:no_map",
        "uglify:compress",
        "jekyll:prod",
        "purgecss:run",
        "cssmin:run",
        "htmlmin:run",
        "cacheBust:run",
        "common_post_build",
    ]);

    grunt.registerTask("build_all", ["build_dev", "build_stage", "build_prod"]);
    grunt.registerTask("serve", ["build_dev", "concurrent:dev"]);
    grunt.registerTask("serve_stage)", ["build_stage", "connect:stage"]);
    grunt.registerTask("deploy_prod", ["build_prod", "compress:prod"]);
};
