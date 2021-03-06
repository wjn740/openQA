FROM opensuse/leap:15.1
LABEL maintainer Jan Sedlak <jsedlak@redhat.com>, Josef Skladanka <jskladan@redhat.com>, wnereiz <wnereiz@eienteiland.org>, Sergio Lindo Mansilla <slindomansilla@suse.com>
LABEL version="0.3"

RUN zypper ar -f obs://devel:openQA/openSUSE_Leap_15.1 openQA && \
    zypper ar -f obs://devel:openQA:Leap:15.1/openSUSE_Leap_15.1 openQA-perl-modules && \
    zypper --gpg-auto-import-keys ref && \
    zypper --non-interactive in ca-certificates-mozilla curl && \
    zypper --non-interactive in openQA-worker qemu-arm qemu-ppc qemu-x86 && \
    zypper --non-interactive in kmod && \
    (zypper --non-interactive in qemu-ovmf-x86_64 || true) && \
    (zypper --non-interactive in qemu-uefi-aarch64 || true)

# set-up qemu
RUN mkdir -p /root/qemu
ADD kvm-mknod.sh /root/qemu/kvm-mknod.sh
RUN chmod +x /root/qemu/*.sh && /root/qemu/kvm-mknod.sh && \
    # set-up shared data and configuration
    rm -rf /etc/openqa/client.conf /etc/openqa/workers.ini && \
    mkdir -p /var/lib/openqa/share && \
    ln -s /data/conf/client.conf /etc/openqa/client.conf && \
    ln -s /data/conf/workers.ini /etc/openqa/workers.ini && \
    ln -s /data/factory /var/lib/openqa/share/factory && \
    ln -s /data/tests /var/lib/openqa/share/tests && \
    # set proper ownership and file modes
    chown -R _openqa-worker /usr/share/openqa/script/worker /var/lib/openqa/cache /var/lib/openqa/pool && \
    chmod -R ug+rw /usr/share/openqa/script/worker /var/lib/openqa/cache /var/lib/openqa/pool && \
    find /usr/share/openqa/script/worker /var/lib/openqa/cache /var/lib/openqa/pool -type d -exec chmod ug+x {} \;

USER _openqa-worker
ENTRYPOINT ["/usr/share/openqa/script/worker", "--verbose", "--instance"]
CMD ["1"]
