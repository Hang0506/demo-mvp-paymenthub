using AutoMapper;
using PaymentHub.Dtos;
using PaymentHub.Entities;

namespace PaymentHub;

public class PaymentHubApplicationAutoMapperProfile : Profile
{
    public PaymentHubApplicationAutoMapperProfile()
    {
        CreateMap<PaymentMethod, PaymentMethodDto>()
            .ForMember(dest => dest.IconUrl, opt => opt.MapFrom(src => src.IconUrl));

        CreateMap<PaymentSplit, PaymentSplitResultDto>()
            .ForMember(dest => dest.SplitCode, opt => opt.MapFrom(src => src.SplitCode))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.State.ToString()))
            .ForMember(dest => dest.RedirectUrl, opt => opt.MapFrom(src => src.RedirectUrl));

        CreateMap<PaymentSplit, PaymentSplitStatusDto>()
            .ForMember(dest => dest.SplitCode, opt => opt.MapFrom(src => src.SplitCode))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.State.ToString()))
            .ForMember(dest => dest.ProviderTransactionId, opt => opt.MapFrom(src => src.ProviderTransactionId));
    }
}