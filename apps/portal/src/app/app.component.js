import { __decorate, __metadata } from "tslib";
import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { AuthService, IfLoggedInDirective, RolesDirective, ZenLoginLinkComponent } from '@zen/auth';
import { ZenLayoutComponent } from '@zen/components';
let AppComponent = class AppComponent {
    constructor(auth) {
        this.auth = auth;
    }
};
AppComponent = __decorate([
    Component({
        selector: 'zen-root',
        templateUrl: './app.component.html',
        standalone: true,
        imports: [
            IfLoggedInDirective,
            MatListModule,
            RolesDirective,
            RouterModule,
            ZenLayoutComponent,
            ZenLoginLinkComponent,
        ],
    }),
    __metadata("design:paramtypes", [AuthService])
], AppComponent);
export { AppComponent };
//# sourceMappingURL=app.component.js.map