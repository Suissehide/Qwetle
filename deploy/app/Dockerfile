FROM nginx:alpine
COPY src/ /usr/share/nginx/html/
COPY deploy/app/default.conf /etc/nginx/conf.d/default.conf
ENTRYPOINT ["/usr/sbin/nginx"]
CMD ["-g", "daemon off;"]