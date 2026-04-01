from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.views import MeView, UserViewSet, register_view, roles_view
from appointments.views import AppointmentViewSet
from billing.views import InvoiceLineViewSet, InvoiceViewSet, PaymentViewSet
from patients.views import PatientViewSet
from pharmacy.views import DispenseViewSet, InventoryTxnViewSet, MedicationViewSet, StockLotViewSet

router = DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"patients", PatientViewSet)
router.register(r"appointments", AppointmentViewSet)
router.register(r"invoices", InvoiceViewSet)
router.register(r"invoice-lines", InvoiceLineViewSet)
router.register(r"payments", PaymentViewSet)
router.register(r"medications", MedicationViewSet)
router.register(r"stock-lots", StockLotViewSet)
router.register(r"inventory-txns", InventoryTxnViewSet)
router.register(r"dispenses", DispenseViewSet)

urlpatterns = [
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", register_view, name="register"),
    path("roles/", roles_view, name="roles"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
