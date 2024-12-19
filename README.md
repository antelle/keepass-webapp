<div align="center">
<h6>Docker image for Keeweb</h6>
<h1>🔑 Keeweb Password Manager 🔑</h1>

<br />

The `docker/keeweb` branch contains the Keeweb password manager within a docker image, which allows you to host it within **[Docker](https://docker.com)**, instead of a bare-metal or local install.

</p>

<br />

<img src="https://github.com/keeweb/keeweb/raw/master/img/screenshot.png" height="280">

<br />
<br />

</div>

<br />

<div align="center">

<!-- prettier-ignore-start -->
[![Version][github-version-img]][github-version-uri]
[![Docker Version][dockerhub-version-img]][dockerhub-version-uri]
[![Downloads][github-downloads-img]][github-downloads-uri]
[![Docker Pulls][dockerhub-pulls-img]][dockerhub-pulls-uri]
[![Build Status][github-build-img]][github-build-uri]
[![Size][github-size-img]][github-size-img]
[![Last Commit][github-commit-img]][github-commit-img]
<!-- prettier-ignore-end -->

</div>

<br />

---

<br />

- [About](#about)
- [Image Options](#image-options)
  - [Image Sources](#image-sources)
- [Install](#install)
  - [Docker Run](#docker-run)
  - [Docker Compose](#docker-compose)
  - [Traefik](#traefik)
    - [Dynamic.yml](#dynamicyml)
    - [Static.yml](#staticyml)
      - [certificatesResolvers](#certificatesresolvers)
      - [entryPoints (Normal)](#entrypoints-normal)
      - [entryPoints (Cloudflare)](#entrypoints-cloudflare)
- [Env Variables \& Volumes](#env-variables--volumes)
  - [Environment Variables](#environment-variables)
  - [Volumes](#volumes)
- [Shell / Bash](#shell--bash)
- [SSL Certificates](#ssl-certificates)
- [Logs](#logs)
- [Build](#build)
  - [Before Building](#before-building)
    - [LF over CRLF](#lf-over-crlf)
    - [Set `+x / 0755` Permissions](#set-x--0755-permissions)
  - [Build `docker/alpine-base` Image](#build-dockeralpine-base-image)
    - [amd64](#amd64)
    - [arm64 / aarch64](#arm64--aarch64)
  - [Build `docker/keeweb` Image](#build-dockerkeeweb-image)
    - [amd64](#amd64-1)
    - [arm64 / aarch64](#arm64--aarch64-1)
    - [hub.docker.com / ghcr.io / local](#hubdockercom--ghcrio--local)
    - [Image Tags](#image-tags)
  - [Extra Notes](#extra-notes)
    - [Custom Scripts](#custom-scripts)

<br />

---

<br />

## About
This repository contains Keeweb Password Manager, distributed within a docker image which can be deployed and utilized in your browser.

<br />

---

<br />

## Image Options
Use any of the following images in your `docker-compose.yml` or `run` command:

<br />

### Image Sources
You may pick from the following vendors and architecture:

<br />

| Service | Version | Image Link |
| --- | --- | --- |
| `Docker Hub` | [![Docker Version][dockerhub-version-ftb-img]][dockerhub-version-ftb-uri] | `keeweb/keeweb:latest` <br /> `keeweb/keeweb:1.19.0` <br /> `keeweb/keeweb:1.19.0-amd64` <br /> `keeweb/keeweb:1.19.0-arm64` <br /> `keeweb/keeweb:development` <br /> `keeweb/keeweb:development-amd64` <br /> `keeweb/keeweb:development-arm64` |
| `Github` | [![Github Version][github-version-ftb-img]][github-version-ftb-uri] | `ghcr.io/keeweb/keeweb:latest` <br /> `ghcr.io/keeweb/keeweb:1.19.0` <br /> `ghcr.io/keeweb/keeweb:1.19.0-amd64` <br /> `ghcr.io/keeweb/keeweb:1.19.0-arm64` <br /> `ghcr.io/keeweb/keeweb:development` <br /> `ghcr.io/keeweb/keeweb:development-amd64` <br /> `ghcr.io/keeweb/keeweb:development-arm64` |

<br />

---

<br />

## Install
Instructions on using this container

<br />

### Docker Run
If you want to bring the docker container up quickly, use the following command:

```shell
docker run -d --restart=unless-stopped -p 443:443 --name keeweb -v ${PWD}/keeweb:/config ghcr.io/keeweb/keeweb:latest
```

<br />

### Docker Compose
Create a new `docker-compose.yml` with the following:

```yml
services:
    keeweb:
        container_name: keeweb
        image: ghcr.io/keeweb/keeweb:latest          # Github image
      # image: keeweb/keeweb:latest                  # Dockerhub image
        restart: unless-stopped
        volumes:
            - ./keeweb:/config
        environment:
            - PUID=1000
            - PGID=1000
            - TZ=Etc/UTC
```

<br />

<br />

### Traefik
You can put this container behind Traefik if you want to use a reverse proxy and let Traefik handle the SSL certificate.

<br />

> [!NOTE]
> These steps are **optional**. 
> 
> If you do not use Traefik, you can skip this section of steps. This is only for users who wish to put this container behind Traefik.

<br />

#### Dynamic.yml
Open the Traefik dynamic file which is usually named `dynamic.yml`. We need to add a new `middleware`, `router`, and `service` to our Traefik dynamic file so that it knows about our new Keeweb container and where it is.

```yml
http:
    middlewares:
        https-redirect:
            redirectScheme:
                scheme: "https"
                permanent: true

    routers:
        keeweb-http:
            service: keeweb
            rule: Host(`domain.localhost`) || Host(`keeweb.domain.com`)
            entryPoints:
                - http
            middlewares:
                - https-redirect@file

        keeweb-https:
            service: keeweb
            rule: Host(`domain.localhost`) || Host(`keeweb.domain.com`)
            entryPoints:
                - https
            tls:
                certResolver: cloudflare
                domains:
                    - main: "domain.com"
                      sans:
                          - "*.domain.com"

    services:
        keeweb:
            loadBalancer:
                servers:
                    - url: "https://keeweb:443"
```

<br />

#### Static.yml
These entries will go in your Traefik `static.yml` file. Any changes made to this file requires that you reset Traefik afterward.

<br />

##### certificatesResolvers

Open your Traefik `static.yml` file and add your `certResolver` from above. We are going to use Cloudflare in this exmaple, you can use whatever from the list at:
- https://doc.traefik.io/traefik/https/acme/#providers

<br />

```yml
certificatesResolvers:
    cloudflare:
        acme:
            email: youremail@address.com
            storage: /cloudflare/acme.json
            keyType: EC256
            preferredChain: 'ISRG Root X1'
            dnsChallenge:
                provider: cloudflare
                delayBeforeCheck: 15
                resolvers:
                    - "1.1.1.1:53"
                    - "1.0.0.1:53"
                disablePropagationCheck: true
```

<br />

Once you pick the DNS / SSL provider you want to use from the code above, you need to see if that provider has any special environment variables that must be set. The [Providers Page](https://doc.traefik.io/traefik/https/acme/#providers) lists all providers and also what env variables need set for each one.

<br />

In our example, since we are using Cloudflare for `dnsChallenge` -> `provider`, we must set:
- `CF_API_EMAIL`
- `CF_API_KEY`

<br />

Create a `.env` environment file in the same folder where your Traefik `docker-compose.yml` file is located, and add the following:

```yml
CF_API_EMAIL=yourcloudflare@email.com
CF_API_KEY=Your-Cloudflare-API-Key
```

<br />

Save the `.env` file and exit.

<br />

##### entryPoints (Normal)
Finally, inside the Traefik `static.yml`, we need to make sure we have our `entryPoints` configured. Add the following to the Traefik `static.yml` file only if you **DON'T** have entry points set yet:

```yml
entryPoints:
    http:
        address: :80
        http:
            redirections:
                entryPoint:
                    to: https
                    scheme: https

    https:
        address: :443
        http3: {}
        http:
            tls:
                options: default
                certResolver: cloudflare
                domains:
                    - main: domain.com
                      sans:
                          - '*.domain.com'
```

<br />

##### entryPoints (Cloudflare)
If your website is behind Cloudflare's proxy service, you need to modify your `entryPoints` above so that you can automatically allow Cloudflare's IP addresses through. This means your entry points will look a bit different.

<br />

In the example below, we will add `forwardedHeaders` -> `trustedIPs` and add all of Cloudflare's IPs to the list which are available here:
- https://cloudflare.com/ips/

```yml
    http:
        address: :80
        forwardedHeaders:
            trustedIPs: &trustedIps
                - 103.21.244.0/22
                - 103.22.200.0/22
                - 103.31.4.0/22
                - 104.16.0.0/13
                - 104.24.0.0/14
                - 108.162.192.0/18
                - 131.0.72.0/22
                - 141.101.64.0/18
                - 162.158.0.0/15
                - 172.64.0.0/13
                - 173.245.48.0/20
                - 188.114.96.0/20
                - 190.93.240.0/20
                - 197.234.240.0/22
                - 198.41.128.0/17
                - 2400:cb00::/32
                - 2606:4700::/32
                - 2803:f800::/32
                - 2405:b500::/32
                - 2405:8100::/32
                - 2a06:98c0::/29
                - 2c0f:f248::/32
        http:
            redirections:
                entryPoint:
                    to: https
                    scheme: https

    https:
        address: :443
        http3: {}
        forwardedHeaders:
            trustedIPs: *trustedIps
        http:
            tls:
                options: default
                certResolver: cloudflare
                domains:
                    - main: domain.com
                      sans:
                          - '*.domain.com'
```

<br />

Save the files and then give Traefik and your Keeweb containers a restart.

<br />

---

<br />

## Env Variables & Volumes
This section outlines that environment variables can be specified, and which volumes you can mount when the container is started.

<br />

### Environment Variables
The following env variables can be modified before spinning up this container:

<br />

| Env Var | Default | Description |
| --- | --- | --- |
| `PUID` | 1000 | <sub>User ID running the container</sub> |
| `PGID` | 1000 | <sub>Group ID running the container</sub> |
| `TZ` | Etc/UTC | <sub>Timezone</sub> |
| `PORT_HTTP` | 80 | <sub>Defines the HTTP port to run on</sub> |
| `PORT_HTTPS` | 443 | <sub>Defines the HTTPS port to run on</sub> |

<br />

### Volumes
The following volumes can be mounted with this container:

<br />

| Volume | Description |
| --- | --- |
| `./keeweb:/config` | <sub>Path which stores Keeweb, nginx configs, and optional SSL certificate/keys</sub> |
| `./custom-scripts:/custom-cont-init.d:ro` | <sub>**Experts Only**: Allows you to load advanced startup scripts executed when the container comes online</sub> |

<br />

By mounting the volume above, you should now have access to the following folders:
<br />

| Folder | Description |
| --- | --- |
| `📁 keys` | <sub>SSL certificate `cert.crt` + key `cert.key`</sub> |
| `📁 log` | <sub>All nginx and php logs</sub> |
| `📁 nginx` | <sub>`nginx.conf`, `resolver.conf`, `ssl.conf`, `site-confs`</sub> |
| `📁 www` | <sub>Folder which stores the Keeweb files, images, and plugins</sub> |

<br />

---

<br />

## Shell / Bash
You can access the docker container's shell by running:

```shell
docker exec -it keeweb ash
```

<br />

---

<br />

## SSL Certificates
This docker image automatically generates an SSL certificate when the nginx server is brought online. 

<br />

You may opt to either use the generated self-signed certificate, or you can add your own. If you decide to use your own self-signed certificate, ensure you have mounted the `/config` volume in your `docker-compose.yml`:

```yml
services:
    keeweb:
        container_name: keeweb
        image: ghcr.io/keeweb/keeweb:latest    # Github image
        restart: unless-stopped
        volumes:
            - ./keeweb:/config
```

<br />

Then navigate to the newly mounted folder and add your `📄 cert.crt` and `🔑 cert.key` files to the `📁 /keeweb/keys/*` folder.

<br />

> [!NOTE]
> If you are generating your own certificate and key, we recommend a minimum of:
> - RSA: `2048 bits`
> - ECC: `256 bits`
> - ECDSA: `P-384 or P-521`

<br />

---

<br />

## Logs
This image spits out detailed information about its current progress. You can either use `docker logs` or a 3rd party app such as [Portainer](https://portainer.io/) to view the logs.

<br />

```shell
 Migrations   : Started
 Migrations   : 01-nginx-site-confs-default › Skipped
 Migrations   : Complete
──────────────────────────────────────────────────────────────────────────────────────────
                              Keeweb Password Manager                             
──────────────────────────────────────────────────────────────────────────────────────────
  Thanks for choosing Keeweb. Get started with some of the links below:

        Official Repo           https://github.com/keeweb/keeweb
        Official Site           https://keeweb.info/
        Beta Demo               https://beta.keeweb.info/
        Web App                 https://app.keeweb.info/
        Favicon Service         https://services.keeweb.info/favicon

  If you are making this copy of Keeweb available on a public-facing domain,
  please consider using Traefik and Authentik to protect this container from
  outside access.

        User:Group              1000:1000
        (Ports) HTTP/HTTPS      80/443
──────────────────────────────────────────────────────────────────────────────────────────

 SSL          : Using existing keys found in /config/keys
 Loader       : Custom files found, loading them ...
 Loader       : Executing ...
 Loader       : Checking keeweb-plugins
 Loader       : keeweb-plugins already installed in /config/www/plugins; skipping
 Loader       : plugins: Exited 0
 Core         : Completed loading container
```

<br />

---

<br />

## Build

To build your own Keeweb docker image, there are numerous things to remember. Our Keeweb docker image is built from several parts which we host within different branches of our repo.

| Branch | Description |
| --- | --- |
| **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** | The base alpine image, which installs alpine, nginx, minimal packages, and SSL |
| **[docker/core](https://github.com/keeweb/keeweb/tree/docker/core)** | These scripts are loaded by the **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** `Dockerfile` | 
| **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** | This branch, which stores the Keeweb docker image files | 

<br />

To build a docker image for Keeweb, you need two different docker images:
- **Step 1**: Build **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** image
  - When being build, the alpine-base `Dockerfile` will grab and install the files from this branch `docker/core`
- **Step 2**: Build **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** image
- **Step 3**: Release the docker image built from **Step 2** to Github's **Ghcr.io** or **hub.docker.com**

<br />

> [!WARNING]
> You should NOT need to modify any of the files within this branch `docker/keeweb` unless you absolutely know what you are doing.

<br />

### Before Building

Prior to building the ****[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)**** and **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** docker images, you **must** ensure the following conditions are met. If the below tasks are not performed, your docker container will throw the following errors when started:

- `Failed to open apk database: Permission denied`
- `s6-rc: warning: unable to start service init-adduser: command exited 127`
- `unable to exec /etc/s6-overlay/s6-rc.d/init-envfile/run: Permission denied`
- `/etc/s6-overlay/s6-rc.d/init-adduser/run: line 34: kwown: command not found`
- `/etc/s6-overlay/s6-rc.d/init-adduser/run: /usr/bin/kwown: cannot execute: required file not found`

<br />

#### LF over CRLF

You cannot utilize Windows' `Carriage Return Line Feed`. All files must be converted to Unix' `Line Feed`.  This can be done with **[Visual Studio Code](https://code.visualstudio.com/)**. OR; you can run the Linux terminal command `dos2unix` to convert these files.

For the branches **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** and **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)**, you can use the following recursive commands:

<br />

> [!CAUTION]
> Be careful using the command to change **ALL** files. You should **NOT** change the files in your `.git` folder, otherwise you will corrupt your git indexes.
>
> If you accidentally run dos2unix on your `.git` folder, do NOT push anything to git. Pull a new copy from the repo.

<br />

```shell
# Change ALL files
find ./ -type f | grep -Ev '.git|*.jpg|*.jpeg|*.png' | xargs dos2unix --

# Change run / binaries
find ./ -type f -name 'run' | xargs dos2unix --
```

<br />

For the branch **[docker/core](https://github.com/keeweb/keeweb/tree/docker/core)**, you can use the following commands:

```shell
dos2unix docker-images.v3
dos2unix kwown.v1
dos2unix package-install.v1
dos2unix with-contenv.v1
```

<br />

#### Set `+x / 0755` Permissions
The files contained within this repo **MUST** have `chmod 755` /  `+x` executable permissions. If you are using the **[Keeweb Github Workflow](https://github.com/keeweb/keeweb/blob/master/.github/workflows/deploy-docker-github.yml)**, this is done automatically. If you are builting the images manually; you need to do this. Ensure those files have the correct permissions prior to building the Alpine base docker image.

If you are building the **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** or **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** images, you must ensure the files in those branches have the proper permissions. All of the executable files are named `run`:

```shell
find ./ -name 'run' -exec chmod +x {} \;
```

<br />

If you want to set the permissions manually, run the following:

```shell
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-adduser/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-crontab-config/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-custom-files/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-envfile/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-folders/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-keygen/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-migrations/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-nginx/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-permissions/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-php/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-samples/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/init-version-checks/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/svc-cron/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/svc-nginx/run
sudo chmod +x /root/etc/s6-overlay/s6-rc.d/svc-php-fpm/run
```

<br />

For the branch **[docker/core](https://github.com/keeweb/keeweb/tree/docker/core)**, there are a few files to change. The ending version number may change, but the commands to change the permissions are as follows:

```shell
sudo chmod +x docker-images.v3
sudo chmod +x kwown.v1
sudo chmod +x package-install.v1
sudo chmod +x with-contenv.v1
```

<br />

### Build `docker/alpine-base` Image

The scripts contained within this `docker/core` branch do not need anything done to them. In order to use these scripts, clone the **[Keeweb Alpine Base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** branch `docker/alpine-base`:

```shell
git clone -b docker/alpine-base https://github.com/keeweb/keeweb.git .
```

<br />

Once cloned, the calls to include the scripts in this `docker/core` branch are within the `Dockerfile` and `Dockerfile.aarch64`. All you need to do is simply build your alpine-base image:

#### amd64

```shell ignore
# Build keeweb alpine-base amd64
docker build --build-arg VERSION=3.20 --build-arg BUILD_DATE=20241216 -t alpine-base:latest -t alpine-base:3.20-amd64 -f Dockerfile .
```

<br />

#### arm64 / aarch64

```shell
# Build keeweb alpine-base arm64
docker build --build-arg VERSION=3.20 --build-arg BUILD_DATE=20241216 -t alpine-base:3.20-arm64 -f Dockerfile.aarch64 .
```

<br />

The flow of the process is outlined below:

```mermaid
%%{init: { 'themeVariables': { 'fontSize': '10px' }}}%%
flowchart TB

subgraph GRAPH_KEEWEB ["Build keeweb:latest"]
    direction TB
    obj_step10["`&gt; git clone -b docker/keeweb github.com/keeweb/keeweb.git`"]
    obj_step11["`**Dockerfile
     Dockerfile.aarch64**`"]
    obj_step12["`&gt; docker build &bsol;
    --build-arg VERSION=1.19.0 &bsol;
    --build-arg BUILD_DATE=20241216 &bsol;
    -t keeweb:latest &bsol;
    -t keeweb:1.19.0-amd64 &bsol;
    -f Dockerfile . &bsol;`"]
    obj_step13["`Download **alpine-base** from branch **docker/alpine-base**`"]
    obj_step14["`New Image: **keeweb:latest**`"]

    style obj_step10 text-align:center,stroke-width:1px,stroke:#555
    style obj_step11 text-align:left,stroke-width:1px,stroke:#555
    style obj_step12 text-align:left,stroke-width:1px,stroke:#555
    style obj_step13 text-align:left,stroke-width:1px,stroke:#555
end

style GRAPH_KEEWEB text-align:center,stroke-width:1px,stroke:transparent,fill:transparent

subgraph GRAPH_ALPINE["Build alpine-base:latest Image"]
direction TB
    obj_step20["`&gt; git clone -b docker/alpine-base github.com/keeweb/keeweb.git`"]
    obj_step21["`**Dockerfile
     Dockerfile.aarch64**`"]
    obj_step22["`&gt; docker build &bsol;
    --build-arg VERSION=3.20 &bsol;
    --build-arg BUILD_DATE=20241216 &bsol;
    -t docker-alpine-base:latest &bsol;
    -t docker-alpine-base:3.20-amd64 &bsol;
    -f Dockerfile . &bsol;`"]
    obj_step23["`Download files from branch **docker/core**`"]
    obj_step24["`New Image: **alpine-base:latest**`"]

    style obj_step20 text-align:center,stroke-width:1px,stroke:#555
    style obj_step21 text-align:left,stroke-width:1px,stroke:#555
    style obj_step22 text-align:left,stroke-width:1px,stroke:#555
    style obj_step23 text-align:left,stroke-width:1px,stroke:#555
end

style GRAPH_ALPINE text-align:center,stroke-width:1px,stroke:transparent,fill:transparent

GRAPH_KEEWEB --> obj_step10 --> obj_step11 --> obj_step12 --> obj_step13 --> obj_step14
GRAPH_ALPINE --> obj_step20 --> obj_step21 --> obj_step22 --> obj_step23 --> obj_step24
```

<br />

Once the base alpine image is built, you can now build the actual docker version of Keeweb. The files for this docker image are stored in the branch `docker/keeweb`:

- https://github.com/keeweb/keeweb/tree/docker/keeweb

<br />

### Build `docker/keeweb` Image

After the **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** image is built, you can now use that docker image as a base to build the **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** image. Navigate to the branch `docker/keeweb` and open the files:

- `Dockerfile`
- `Dockerfile.aarch64`

<br />

Next, specify the **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** image which will be used as the foundation of the **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** image:

```shell
# Dockerfile
FROM ghcr.io/keeweb/alpine-base:3.20-amd64

# Dockerfile.aarch64
FROM ghcr.io/keeweb/alpine-base:3.20-arm64
```

After you have completed configuring the **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** `Dockerfile`, you can now build the official version of Keeweb. Remember to build an image for both `amd64` and `aarch64`.

<br />

For the argument `VERSION`; specify the current release of Keeweb which will be contained within the docker image. It should be in the format of `YYYYMMDD`:

<br />

#### amd64

```shell
# Build docker/keeweb amd64
docker build --build-arg VERSION=1.19.0 --build-arg BUILD_DATE=20241216 -t keeweb:latest -t keeweb:1.19.0 -t keeweb:1.19.0-amd64 -f Dockerfile .
```

<br />

#### arm64 / aarch64

```shell
# Build docker/keeweb arm64
docker build --build-arg VERSION=1.19.0 --build-arg BUILD_DATE=20241216 -t keeweb:1.19.0-arm64 -f Dockerfile.aarch64 .
```

<br />

#### hub.docker.com / ghcr.io / local
After you have your **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** image built, you can either upload the image to a public repository such as:

- hub.docker.com (Docker Hub)
- ghcr.io (Github)

After it is uploaded, you can use the `docker run` command, or create a `docker-compose.yml`, and call the docker image to be used. 

This is discussed in the section **[Using docker/keeweb Image](#using-dockerkeeweb-image)** below.

<br />

#### Image Tags
When building your images with the commands provided above, ensure you create two sets of tags:

| Architecture | Dockerfile | Tags |
| --- | --- | --- |
| `amd64` | `Dockerfile` | `keeweb:latest` <br /> `keeweb:1.19.0` <br /> `keeweb:1.19.0-amd64` |
| `arm64` | `Dockerfile.aarch64` | `keeweb:1.19.0-arm64` |

<br />

the `amd64` arch gets a few extra tags because it should be the default image people clone. 

### Extra Notes

The following are other things to take into consideration when creating the **[docker/alpine-base](https://github.com/keeweb/keeweb/tree/docker/alpine-base)** and **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** images:

<br />

#### Custom Scripts

The `docker/alpine-base` and `docker/keeweb` images support the ability of adding custom scripts that will be ran when the container is started. To create / add a new custom script to the container, you need to create a new folder in the container source files `/root` folder

```shell
mkdir -p /root/custom-cont-init.d/
```

<br />

Within this new folder, add your custom script:

```shell
nano /root/custom-cont-init.d/my_customs_script
```

<br />

```bash
#!/bin/bash

echo "**** INSTALLING BASH ****"
apk add --no-cache bash
```

<br />

When you create the docker image, this new script will automatically be loaded. You can also do this via the `docker-compose.yml` file by mounting a new volume:

```yml
services:
    keeweb:
        volumes:
            - ./keeweb:/config
            - ./custom-scripts:/custom-cont-init.d:ro
```

<br />

> [!NOTE]
> if using compose, we recommend mounting them **read-only** (`:ro`) so that container processes cannot write to the location.

> [!WARNING]
> The folder `/root/custom-cont-init.d` **MUST** be owned by `root`. If this is not the case, this folder will be renamed and a new empty folder will be created. This is to prevent remote code execution by putting scripts in the aforesaid folder.

<br />

The **[docker/keeweb](https://github.com/keeweb/keeweb/tree/docker/keeweb)** image already contains a custom script called `/root/custom-cont-init.d/plugins`. Do **NOT** edit this script. It is what automatically downloads the official Keeweb plugins and adds them to the container.

<br />

---

<br />

<!-- BADGE > GENERAL -->
  [general-npmjs-uri]: https://npmjs.com
  [general-nodejs-uri]: https://nodejs.org
  [general-npmtrends-uri]: http://npmtrends.com/keeweb

<!-- BADGE > VERSION > GITHUB -->
  [github-version-img]: https://img.shields.io/github/v/tag/keeweb/keeweb?logo=GitHub&label=Version&color=ba5225
  [github-version-uri]: https://github.com/keeweb/keeweb/releases

<!-- BADGE > VERSION > GITHUB (For the Badge) -->
  [github-version-ftb-img]: https://img.shields.io/github/v/tag/keeweb/keeweb?style=for-the-badge&logo=github&logoColor=FFFFFF&logoSize=34&label=%20&color=ba5225
  [github-version-ftb-uri]: https://github.com/keeweb/keeweb/releases

<!-- BADGE > VERSION > NPMJS -->
  [npm-version-img]: https://img.shields.io/npm/v/keeweb?logo=npm&label=Version&color=ba5225
  [npm-version-uri]: https://npmjs.com/package/keeweb

<!-- BADGE > VERSION > PYPI -->
  [pypi-version-img]: https://img.shields.io/pypi/v/keeweb
  [pypi-version-uri]: https://pypi.org/project/keeweb/

<!-- BADGE > LICENSE > MIT -->
  [license-mit-img]: https://img.shields.io/badge/MIT-FFF?logo=creativecommons&logoColor=FFFFFF&label=License&color=9d29a0
  [license-mit-uri]: https://github.com/keeweb/keeweb/blob/main/LICENSE

<!-- BADGE > GITHUB > DOWNLOAD COUNT -->
  [github-downloads-img]: https://img.shields.io/github/downloads/keeweb/keeweb/total?logo=github&logoColor=FFFFFF&label=Downloads&color=376892
  [github-downloads-uri]: https://github.com/keeweb/keeweb/releases

<!-- BADGE > NPMJS > DOWNLOAD COUNT -->
  [npmjs-downloads-img]: https://img.shields.io/npm/dw/%40keeweb%2Fkeeweb?logo=npm&&label=Downloads&color=376892
  [npmjs-downloads-uri]: https://npmjs.com/package/keeweb

<!-- BADGE > GITHUB > DOWNLOAD SIZE -->
  [github-size-img]: https://img.shields.io/github/repo-size/keeweb/keeweb?logo=github&label=Size&color=59702a
  [github-size-uri]: https://github.com/keeweb/keeweb/releases

<!-- BADGE > NPMJS > DOWNLOAD SIZE -->
  [npmjs-size-img]: https://img.shields.io/npm/unpacked-size/keeweb/latest?logo=npm&label=Size&color=59702a
  [npmjs-size-uri]: https://npmjs.com/package/keeweb

<!-- BADGE > CODECOV > COVERAGE -->
  [codecov-coverage-img]: https://img.shields.io/codecov/c/github/keeweb/keeweb?token=MPAVASGIOG&logo=codecov&logoColor=FFFFFF&label=Coverage&color=354b9e
  [codecov-coverage-uri]: https://codecov.io/github/keeweb/keeweb

<!-- BADGE > ALL CONTRIBUTORS -->
  [contribs-all-img]: https://img.shields.io/github/all-contributors/keeweb/keeweb?logo=contributorcovenant&color=de1f6f&label=contributors
  [contribs-all-uri]: https://github.com/all-contributors/all-contributors

<!-- BADGE > GITHUB > BUILD > NPM -->
  [github-build-img]: https://img.shields.io/github/actions/workflow/status/keeweb/keeweb/deploy-docker-github.yml?logo=github&logoColor=FFFFFF&label=Build&color=%23278b30
  [github-build-uri]: https://github.com/keeweb/keeweb/actions/workflows/deploy-docker-github.yml

<!-- BADGE > GITHUB > BUILD > Pypi -->
  [github-build-pypi-img]: https://img.shields.io/github/actions/workflow/status/keeweb/keeweb/release-pypi.yml?logo=github&logoColor=FFFFFF&label=Build&color=%23278b30
  [github-build-pypi-uri]: https://github.com/keeweb/keeweb/actions/workflows/pypi-release.yml

<!-- BADGE > GITHUB > TESTS -->
  [github-tests-img]: https://img.shields.io/github/actions/workflow/status/keeweb/keeweb/npm-tests.yml?logo=github&label=Tests&color=2c6488
  [github-tests-uri]: https://github.com/keeweb/keeweb/actions/workflows/npm-tests.yml

<!-- BADGE > GITHUB > COMMIT -->
  [github-commit-img]: https://img.shields.io/github/last-commit/keeweb/keeweb?logo=conventionalcommits&logoColor=FFFFFF&label=Last%20Commit&color=313131
  [github-commit-uri]: https://github.com/keeweb/keeweb/commits/main/

<!-- BADGE > DOCKER HUB > VERSION -->
  [dockerhub-version-img]: https://img.shields.io/docker/v/antelle/keeweb/latest?logo=docker&logoColor=FFFFFF&label=Docker%20Version&color=ba5225
  [dockerhub-version-uri]: https://hub.docker.com/repository/docker/antelle/keeweb/general

<!-- BADGE > DOCKER HUB > VERSION (For the Badge) -->
  [dockerhub-version-ftb-img]: https://img.shields.io/docker/v/antelle/keeweb/latest?style=for-the-badge&logo=docker&logoColor=FFFFFF&logoSize=34&label=%20&color=ba5225
  [dockerhub-version-ftb-uri]: https://hub.docker.com/repository/docker/antelle/keeweb/tags

<!-- BADGE > DOCKER HUB > PULLS -->
  [dockerhub-pulls-img]: https://img.shields.io/docker/pulls/antelle/keeweb?logo=docker&logoColor=FFFFFF&label=Docker%20Pulls&color=af9a00
  [dockerhub-pulls-uri]: https://hub.docker.com/repository/docker/antelle/keeweb/general

