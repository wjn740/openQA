# Copyright (C) 2019 SUSE LLC
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License along
# with this program; if not, write to the Free Software Foundation, Inc.,
# 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.

package OpenQA::WebSockets::Plugin::Helpers;
use Mojo::Base 'Mojolicious::Plugin';

use OpenQA::Schema;

sub register {
    my ($self, $app) = @_;

    $app->helper(log_name => sub { 'websockets' });
    $app->helper(schema   => sub { OpenQA::Schema->singleton });

    $app->helper(ws_is_worker_connected => \&_ws_is_worker_connected);
}

sub _ws_is_worker_connected {
    my ($c, $workerid) = @_;
    my $workers = $OpenQA::WebSockets::Server::WORKERS;
    return ($workers->{$workerid} && $workers->{$workerid}->{socket} ? 1 : 0);
}

1;
